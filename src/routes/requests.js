const express = require("express");
const requestRouter = express.Router();
const { userAuth } = require("../middleware/auth");
const User = require("../models/user");
const connectionRequest = require("../models/connectionRequest");
const Notification = require("../models/notification");
const { getIo } = require("../utils/socket");

requestRouter.post(
  "/requests/send/:status/:toUserId",
  userAuth,
  async (req, res) => {
    try {
      const { status, toUserId } = req.params;
      const fromUserId = req.user._id;

      //checking status
      const ALLOWED_STATUS = ["interested", "ignored"];
      if (!ALLOWED_STATUS.includes(status)) {
        throw new Error("Status is invalid");
      }

      //toSenderID exists?
      const senderId = await User.findById(toUserId);
      if (!senderId) {
        throw new Error("User not found");
      }

      //checking if the connection already exists
      const existingConnectionRequest = await connectionRequest.findOne({
        $or: [
          { fromUserId, toUserId },
          { fromUserId: toUserId, toUserId: fromUserId },
        ],
      });
      if (existingConnectionRequest) {
        throw new Error("Connection already exists");
      }

      //creating the document
      const requestObject = new connectionRequest({
        fromUserId,
        toUserId,
        status,
      });
      await requestObject.save();

      //creating notification
      if (status === "interested") {
        const newNotification = new Notification({
          recipient: toUserId,
          sender: fromUserId,
          message: req.user.firstName + " sent you a request",
          type: "connection_request",
        });

        await newNotification.save();

        await newNotification.populate("sender", "firstName lastName photoUrl");

        const io = getIo();
        io.to(`user:${toUserId}`).emit("newNotification", newNotification);
      }
      //sendin the response
      res.json({
        message:
          req.user.firstName + " " + status + " in " + senderId.firstName,
        data: requestObject,
      });
    } catch (err) {
      console.log(err);
      res.status(400).send("ERRO: " + err.message);
    }
  },
);

requestRouter.post(
  "/requests/review/:status/:requestId",
  userAuth,
  async (req, res) => {
    try {
      const loggedInUser = req.user;
      const { status, requestId } = req.params;

      const ALLOWED_STATUS = ["accepted", "rejected"];

      //checking status
      if (!ALLOWED_STATUS.includes(status)) {
        throw new Error("status is invalude");
      }

      //finding the connection requestID
      const connectionRequestObject = await connectionRequest.findOne({
        _id: requestId,
        status: "interested",
        toUserId: loggedInUser._id,
      });

      //checking does requestid exist or not
      if (!connectionRequestObject) {
        return res
          .status(400)
          .json({ message: "request connection not found" });
      }

      //updatin status
      connectionRequestObject.status = status;
      await connectionRequestObject.save();

      if (status === "accepted") {
        const newNotification = new Notification({
          recipient: connectionRequestObject.fromUserId,
          sender: connectionRequestObject.toUserId,
          message: req.user.firstName + " accepted your request",
          type: "connection_accepted",
        });

        await newNotification.save();

        await newNotification.populate("sender", "firstName lastName photoUrl");

        const io = getIo();
        io.to(`user:${connectionRequestObject.fromUserId}`).emit(
          "newNotification",
          newNotification,
        );
      }

      res.send("The request is " + status);
    } catch (err) {
      res.status(400).send("ERROR:" + err.message);
    }
  },
);

module.exports = requestRouter;
