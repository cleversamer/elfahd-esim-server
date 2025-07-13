require("dotenv").config();
const express = require("express");
const app = express();
// const xss = require("xss-clean");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const { status: httpStatus } = require("http-status");
const telegramService = require("./telegram.service");
const axios = require("axios");

// The following configuration will limit the number of requests
// for each IP address per a certain amount of time.
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: {
    status: "error",
    statusCode: httpStatus.FORBIDDEN,
    message: "تم حظر جهازك مؤقتًا بسبب عدد كبير من الطلبات.",
  },
});

app.use(limiter);
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("uploads"));
app.use(helmet());
app.use(cors({ origin: true }));
// app.use(xss());

app.post("/refresh", (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: "error",
        message: "رقم الهاتف مطلوب.",
      });
    }

    const isValidPhone = /^05\d{8}$/.test(phone);

    if (!isValidPhone) {
      return res.status(httpStatus.BAD_REQUEST).json({
        status: "error",
        message: "رقم الهاتف غير صالح.",
      });
    }

    axios
      .post(
        "https://api.layan-t.net/api/Subscribtions/CustomersRefreshNumber",
        { number: "0512791852" },
        {
          headers: {
            Accept: "*/*",
            "Accept-Language": "en-US,en;q=0.9,ar;q=0.8",
            "Content-Type": "application/json",
            lang: "ar",
            priority: "u=1, i",
            "sec-ch-ua":
              '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": '"Windows"',
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site",
            Referer: "https://rn.layan-t.net/",
          },
        }
      )
      .then((response) => {
        res.status(httpStatus.OK).json({
          status: "success",
          // message: "تم ارسال طلب التحديث بنجاح.",
          message: response.data,
        });

        telegramService.sendMessage(
          `طلب تحديث شريحة eSIM جديد من رقم الهاتف: ${phone}\nرسالة ليان:\n${response.data}`
        );
      })
      .catch((error) => {
        res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
          status: "failure",
          message: "حدث خطأ ما يرجى المحاولة لاحقًا",
        });

        telegramService.sendMessage(
          `طلب تحديث شريحة eSIM مرفوض من رقم الهاتف: ${phone}\nرسالة ليان:\n${error?.message}`
        );
      });
  } catch (error) {
    console.log(error);

    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      status: "failure",
      message: "حدث خطأ ما يرجى المحاولة لاحقًا",
    });
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
