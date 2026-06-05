import { Server } from "socket.io";
import http from "http";
import express from "express";
import { socketAuthMiddleware } from "../middlewares/socketMiddleware.js";
import { getUserConversationsForSocketIO } from "../controllers/conversationController.js";

const app = express();

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

io.use(socketAuthMiddleware);

const onlineUsers = new Map(); // { userId: socketId }

io.on("connection", async (socket) => {
  const user = socket.user;
  console.log(`${user.displayName} online with socketId ${socket.id}`);

  // ghi danh người này online + thông báo cho các người khác biết
  onlineUsers.set(user._id, socket.id);
  io.emit("online-users", Array.from(onlineUsers.keys()));

  // thêm user vào room cụ thể (mỗi conversation là 1 room khác nhau)
  // mỗi room lấy id là id hội thoại luôn
  const conversationIds = await getUserConversationsForSocketIO(user._id);
  conversationIds.forEach((id) => {
    socket.join(id);
  });

  // khi user tạo conversation mới --> server sẽ join vào phòng này
  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId);
  });

  // tạo phòng theo userId (để phát socket emit khi tạo nhóm - sau này có thể thêm logic như thông báo...)
  socket.join(user._id.toString());

  // disconnect
  socket.on("disconnect", () => {
    // xóa người này khỏi danh sách online + thông báo
    onlineUsers.delete(user._id);
    io.emit("online-users", Array.from(onlineUsers.keys()));
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

export { io, app, server }