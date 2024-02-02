// Analyze it in three days from 21/01/2024 to 24/01/2024

const express = require("express"),
  app = express(),
  port = process.env.port || 4000,
  address = process.env.address || "127.0.0.1",
  cors = require("cors");
  
const bodyParser = require("body-parser");
const dotenv = require("dotenv");
app.use(bodyParser.json());
dotenv.config();

// const EmailNodeController = require("./controller/emailCron");
// const cron = require("node-cron");

const userRouter = require("./src/routes/user");

app.use(cors());
app.use("/user", userRouter);

app.use((error, req, res, next) => {
  const status = error.errorStatus || 500;
  const message = error.message || "internal error";
  const data = error.data;
  res.status(status).json({ message: message, data: data });
});

var server = app.listen(port, address, function () {
  let host = server.address().address;
  let portname = server.address().port;
  console.log("Example server is running in http://%s:%s", host, portname);
});
// cron.schedule("0 6 * * *", function () {
//   EmailNodeController.EmailPmo();
// });
