require("dotenv").config();
const express = require("express");
const app = express();
// const xss = require("xss-clean");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const httpStatus = require("http-status");
const telegramService = require("./telegram.service");

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

    telegramService.sendMessage(
      `طلب تحديث شريحة eSIM جديد من رقم الهاتف: ${phone}`
    );

    res.status(httpStatus.OK).json({
      status: "success",
      message: "تم ارسال طلب التحديث بنجاح.",
    });
  } catch (error) {
    console.log(error);
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`App is listening on port ${port}`);
});
