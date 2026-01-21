const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer();
const onlineUsers = {};

const COLORS = [
  "#e6194b",
  "#3cb44b",
  "#ffe119",
  "#4363d8",
  "#f58231",
  "#911eb4",
  "#46f0f0",
  "#f032e6",
  "#bcf60c",
  "#fabebe",
  "#008080",
  "#e6beff",
];

const userColors = {};

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// io.on("connection", (socket) => {
//   // assign color
//   const color = COLORS[Math.floor(Math.random() * COLORS.length)];
//   userColors[socket.id] = color;

//   console.log("User connected:", socket.id, color);

//   // send color to this user
//   socket.emit("userColor", color);

//   socket.on("cursorMove", (data) => {
//     socket.broadcast.emit("cursorMove", {
//       socketId: socket.id,
//       color: userColors[socket.id],
//       x: data.x,
//       y: data.y,
//     });
//   });

//   socket.on("drawStart", (data) => {
//     socket.broadcast.emit("drawStart", {
//       ...data,
//       color: userColors[socket.id],
//     });
//   });

//   socket.on("draw", (data) => {
//     socket.broadcast.emit("draw", data);
//   });

//   socket.on("disconnect", () => {
//     delete userColors[socket.id];
//     socket.broadcast.emit("cursorLeave", socket.id);
//   });
// });

io.on("connection", (socket) => {
  const identityColor = COLORS[Math.floor(Math.random() * COLORS.length)];

  onlineUsers[socket.id] = {
    id: socket.id,
    color: identityColor,
  };

  userColors[socket.id] = identityColor;

  console.log("User connected:", socket.id);

  // send identity color to this user
  socket.emit("userColor", identityColor);

  // 🔥 broadcast updated online users list
  io.emit("onlineUsers", Object.values(onlineUsers));

  socket.on("cursorMove", ({ x, y }) => {
    socket.broadcast.emit("cursorMove", {
      socketId: socket.id,
      x,
      y,
      color: identityColor,
    });
  });

  socket.on("drawStart", (data) => {
    socket.broadcast.emit("drawStart", data);
  });

  socket.on("draw", (data) => {
    socket.broadcast.emit("draw", data);
  });

  socket.on("disconnect", () => {
    delete onlineUsers[socket.id];
    delete userColors[socket.id];

    socket.broadcast.emit("cursorLeave", socket.id);

    // 🔥 update online users list
    io.emit("onlineUsers", Object.values(onlineUsers));

    console.log("User disconnected:", socket.id);
  });
});

server.listen(3001, () => {
  console.log("🚀 Socket server running on http://localhost:3001");
});
