const express = require("express");
const app = express();
require("dotenv").config();
const port = process.env.PORT || 3000;
const ConnectDB = require("./config/database");
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const profileRouter = require("./routes/profile");
const requestRouter = require("./routes/requests");
const chatRouter = require("./routes/chat");
const userRouter = require("./routes/user");
const notificationRouter = require("./routes/notification");
const cors = require("cors");
const transporter = require("./config/email");
const http = require("http");
const { initializeSocket } = require("./utils/socket");

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(express.json());
app.use(cookieParser());

app.use("/", requestRouter);
app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", userRouter);
app.use("/", chatRouter);
app.use("/", notificationRouter);
// socket.io

const server = http.createServer(app);
initializeSocket(server);

//socket.io

ConnectDB()
  .then(() => {
    console.log("Connected succesfully to database");
    server.listen(port, () => {
      console.log("the server is listening at post 3000");
    });
  })
  .catch((err) => {
    console.log("there was error to connect to the databse");
    console.error(err);
  });

transporter.verify((error, success) => {
  if (error) {
    console.error("❌ Gmail connection failed:");
    console.error(error);
  } else {
    console.log("✅ Gmail SMTP is ready!");
  }
});
