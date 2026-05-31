const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("uploads"));

const DATA_FILE = "data.json";

/* ---------- Helpers ---------- */
function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { posts: [], messages: [], users: [] };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

/* ---------- Uploads ---------- */
const storage = multer.diskStorage({
  destination: "uploads/",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage });

/* ---------- API: Posts ---------- */

// Get posts
app.get("/api/posts", (req, res) => {
  const data = loadData();
  res.json(data.posts);
});

// Create post
app.post("/api/posts", upload.single("media"), (req, res) => {
  const data = loadData();

  const newPost = {
    id: Date.now(),
    text: req.body.text || "",
    media: req.file ? "/uploads/" + req.file.filename : null,
    likes: 0,
    dislikes: 0,
    comments: [],
    createdAt: new Date()
  };

  data.posts.unshift(newPost);
  saveData(data);

  res.json(newPost);
});

// Like / Dislike
app.post("/api/posts/react", (req, res) => {
  const { postId, type } = req.body;

  const data = loadData();
  const post = data.posts.find(p => p.id === postId);

  if (post) {
    if (type === "like") post.likes++;
    if (type === "dislike") post.dislikes++;
  }

  saveData(data);
  res.json(post);
});

// Comment
app.post("/api/posts/comment", (req, res) => {
  const { postId, text } = req.body;

  const data = loadData();
  const post = data.posts.find(p => p.id === postId);

  if (post) {
    post.comments.push({
      text,
      time: new Date()
    });
  }

  saveData(data);
  res.json(post);
});

/* ---------- Chat (Socket.IO) ---------- */
io.on("connection", (socket) => {
  console.log("User connected");

  socket.on("send_message", (msg) => {
    const data = loadData();

    data.messages.push(msg);
    saveData(data);

    io.emit("receive_message", msg);
  });
});

/* ---------- Start Server ---------- */
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
