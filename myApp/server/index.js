const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer();
const onlineUsers = {};
const strokes = [];
const redoStacks = {}; // per-user redo

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
  socket.emit("strokesUpdate", strokes);

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
    delete redoStacks[socket.id];

    socket.broadcast.emit("cursorLeave", socket.id);

    // 🔥 update online users list
    io.emit("onlineUsers", Object.values(onlineUsers));

    console.log("User disconnected:", socket.id);
  });

  socket.on("strokeComplete", (stroke) => {
    strokes.push({ ...stroke, userId: socket.id });
    socket.broadcast.emit("strokePreviewEnd", socket.id);

    redoStacks[socket.id] = []; // clear redo on new stroke
    io.emit("strokesUpdate", strokes);
  });

  socket.on("undo", () => {
    // find last stroke by this user
    for (let i = strokes.length - 1; i >= 0; i--) {
      if (strokes[i].userId === socket.id) {
        const [removed] = strokes.splice(i, 1);

        redoStacks[socket.id] ??= [];
        redoStacks[socket.id].push(removed);

        io.emit("strokesUpdate", strokes);
        return;
      }
    }
  });

  socket.on("redo", () => {
    const stack = redoStacks[socket.id];
    if (!stack || stack.length === 0) return;

    const stroke = stack.pop();
    strokes.push(stroke);

    io.emit("strokesUpdate", strokes);
  });

  socket.on("strokePreview", (previewStroke) => {
    socket.broadcast.emit("strokePreview", {
      ...previewStroke,
      userId: socket.id,
    });
  });
});

server.listen(3001, () => {
  console.log("🚀 Socket server running on http://localhost:3001");
});
