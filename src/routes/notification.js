const express = require("express");
const { userAuth } = require("../middleware/auth");
const notificationRouter = express.Router();
const Notification = require("../models/notification");

notificationRouter.get("/notifications", userAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    const notifications = await Notification.find({ recipient: userId })
      .sort({
        createdAt: -1,
      })
      .populate("sender", ["firstName", "lastName", "photoUrl"]);

    res.send(notifications);
  } catch (err) {
    res.status(400).send("there a error", err.message);
  }
});

notificationRouter.get(
  "/notifications/unread-count",
  userAuth,
  async (req, res) => {
    try {
      const userId = req.user._id;

      const unreadNotificationCount = await Notification.countDocuments({
        recipient: userId,
        isRead: false,
      });
      res.send(unreadNotificationCount);
    } catch (err) {
      res.status(400).send("there a error", err.message);
    }
  },
);

notificationRouter.patch(
  "/notifications/:notificationId/read",
  userAuth,
  async (req, res) => {
    try {
      const { notificationId } = req.params;

      const notificationObj = await Notification.findOne({
        _id: notificationId,
        recipient: req.user._id,
      });

      if (!notificationObj) {
        return res.status(404).send("Notification not found");
      }

      notificationObj.isRead = true;
      await notificationObj.save();

      res.send("notification is updated");
    } catch (err) {
      res.status(400).send("there was a error", err.message);
    }
  },
);

notificationRouter.patch(
  "/notifications/read-all",
  userAuth,
  async (req, res) => {
    try {
      const userId = req.user._id;

      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true } },
      );

      res.send("updated the notifications");
    } catch (err) {
      res.status(400).send("There was an error: " + err.message);
    }
  },
);

module.exports = notificationRouter;
