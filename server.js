require("dotenv").config();
const express = require("express");
const app = express();
const xss = require("xss-clean");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const httpStatus = require("http-status");

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
app.use(xss());

app.listen(process.env.PORT, () => {
  console.log(`App is listening on port ${process.env.PORT}`);
});
