const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const path = require("path");
const multer = require("multer");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// إنشاء مجلد الرفع تلقائياً
try {
  fs.mkdirSync("uploads", { recursive: true });
} catch (err) {
  console.log(err);
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(express.static(path.join(__dirname, "public")));

// قاعدة بيانات مؤقتة بالذاكرة
let posts = [];
let messages = [];
let notifications = [];
let settings = {
  notificationsEnabled: true
};

// رفع الملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ===========================
   POSTS
=========================== */

app.get("/api/posts", (req, res) => {
  res.json(posts);
});

app.post("/api/posts", upload.single("file"), (req, res) => {
  const { author, text } = req.body;

  const post = {
    id: uuidv4(),
    author,
    text,
    file: req.file ? "/uploads/" + req.file.filename : null,
    likes: 0,
    dislikes: 0,
    comments: [],
    createdAt: Date.now()
  };

  posts.unshift(post);

  addNotification(`تم نشر منشور بواسطة ${author}`);

  res.json(post);
});

app.post("/api/posts/:id/like", (req, res) => {
  const post = posts.find(p => p.id === req.params.id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  post.likes++;
  res.json(post);
});

app.post("/api/posts/:id/dislike", (req, res) => {
  const post = posts.find(p => p.id === req.params.id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  post.dislikes++;
  res.json(post);
});

app.post("/api/posts/:id/comment", (req, res) => {
  const post = posts.find(p => p.id === req.params.id);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  post.comments.push({
    author: req.body.author,
    text: req.body.text
  });

  res.json(post);
});

/* ===========================
   MESSAGES
=========================== */

app.get("/api/messages", (req, res) => {
  res.json(messages);
});

app.post("/api/messages", (req, res) => {
  const msg = {
    id: uuidv4(),
    author: req.body.author,
    text: req.body.text,
    createdAt: Date.now()
  };

  messages.push(msg);

  addNotification(`تم إرسال رسالة بواسطة ${msg.author}`);

  io.emit("new-message", msg);

  res.json(msg);
});

/* ===========================
   NOTIFICATIONS
=========================== */

function addNotification(text) {
  notifications.unshift({
    id: uuidv4(),
    text,
    createdAt: Date.now()
  });

  if (notifications.length > 10) {
    notifications = notifications.slice(0, 10);
  }

  io.emit("notifications-update", notifications);
}

app.get("/api/notifications", (req, res) => {
  res.json(notifications);
});

/* ===========================
   SETTINGS
=========================== */

app.get("/api/settings", (req, res) => {
  res.json(settings);
});

app.post("/api/settings", (req, res) => {
  settings.notificationsEnabled =
    req.body.notificationsEnabled;

  res.json(settings);
});

/* ===========================
   SOCKET
=========================== */

io.on("connection", socket => {
  console.log("User connected");

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

/* ===========================
   INDEX
=========================== */

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

/* ===========================
   START
=========================== */

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
