const socket = require("socket.io");
const Chat = require("../models/chat");
const Notification = require("../models/notification");

let io;
const initializeSocket = (server) => {
  io = socket(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    //Handle Events
    socket.on("joinchat", ({ userId, targetUserId }) => {
      const roomId = [userId, targetUserId].sort().join("-");

      socket.join(roomId);
      socket.join(`user:${userId}`);
      socket.activeChat = roomId;
    });

    socket.on("leaveChat", (userId, targetUserId) => {
      const roomId = [userId, targetUserId].sort().join("-");
      socket.leave(roomId);
      socket.activeChat = null;
    });

    socket.on("sendMessage", async (messageObj) => {
      const { userId, targetUserId, text } = messageObj;
      const roomId = [userId, targetUserId].sort().join("-"); //its important to make a room id.

      // Save message in database
      try {
        let chat = await Chat.findOne({
          participants: { $all: [userId, targetUserId] },
        });

        if (!chat) {
          chat = new Chat({
            participants: [targetUserId, userId],
            messages: [],
          });
        }

        chat.messages.push({
          senderId: userId,
          text: text,
        });

        await chat.save();

        const savedMessage = chat.messages[chat.messages.length - 1];
        io.to(roomId).emit("messageRecieved", savedMessage);

        let isRecipientInChat = false;

        const recipientRoom = io.sockets.adapter.rooms.get(
          `user:${targetUserId}`,
        );

        if (recipientRoom) {
          for (const socketId of recipientRoom) {
            const recipientSocket = io.sockets.sockets.get(socketId);
            if (recipientSocket?.activeChat == roomId) {
              isRecipientInChat = true;
              break;
            }
          }
        }

        if (!isRecipientInChat) {
          const existingNotification = await Notification.findOne({
            recipient: targetUserId,
            sender: userId,
            type: "message",
            isRead: false,
          });

          if (!existingNotification) {
            const newNotification = new Notification({
              recipient: targetUserId,
              sender: userId,
              type: "message",
              message: "You received a new message",
            });

            await newNotification.save();
            await newNotification.populate(
              "sender",
              "firstName lastName photoUrl",
            );
            io.to(`user:${targetUserId}`).emit(
              "newNotification",
              newNotification,
            );
          }
        }
      } catch (err) {
        console.log(err);
      }
      //
    });

    //video call events

    socket.on("join:call", ({ targetUserId, userId }) => {
      const roomId = [targetUserId, userId].sort().join("-");
      console.log("user " + userId + " joining room " + roomId);

      socket.join(roomId);
      socket.to(roomId).emit("user:call:joined", { id: socket.id });
    });

    socket.on("offer", ({ offer, id }) => {
      socket.to(id).emit("offer", { offer, id: socket.id });
    });

    socket.on("answer", ({ answer, id }) => {
      socket.to(id).emit("answer", { answer, id: socket.id });
    });

    socket.on("ice-candidate", ({ candidate, id }) => {
      socket.to(id).emit("ice-candidate", { candidate, id: socket.id });
    });

    //video call events

    //joining user for notification
    socket.on("joinUser", (userId) => {
      const roomId = `user:${userId}`;
      socket.join(roomId);
      console.log(`User ${userId} joined room ${roomId}`);
    });

    //joining user for notification

    socket.on("disconnect", () => {});
  });

  return io;
};

const getIo = () => {
  if (!io) {
    throw new Error("Socket.io has not been initialized");
  }

  return io;
};

module.exports = { getIo, initializeSocket };
