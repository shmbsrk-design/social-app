const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

const UPLOADS = path.join(__dirname, "uploads");
if(!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS);

app.use(express.json());
app.use("/uploads", express.static(UPLOADS));

const upload = multer({ dest: UPLOADS });

const ADMIN_PASS = "mbark#7171124";

/* ================= DATA ================= */
let POSTS = [];
let MESSAGES = [];

/* ================= HOME ================= */
app.get("/", (req,res)=>{
res.sendFile(path.join(__dirname,"index.html"));
});

/* ================= POSTS ================= */
app.post("/post",(req,res)=>{

const {user,text,file,type} = req.body;

if((!text || text.trim()==="") && !file){
return res.json({ok:false,error:"empty post"});
}

let post = {
id: Date.now(),
user,
text: text || "",
file: file || null,
type: type || null,
likes:0,
dislikes:0,
likedBy:[],
dislikedBy:[]
};

POSTS.push(post);

res.json({ok:true,post});
});

app.get("/posts",(req,res)=>{
res.json(POSTS);
});

/* ================= LIKE ================= */
app.post("/like",(req,res)=>{
let p = POSTS.find(x=>x.id==req.body.id);
if(!p) return res.json({ok:false});

if(!p.likedBy.includes(req.body.user)){
p.likes++;
p.likedBy.push(req.body.user);
}

res.json({ok:true});
});

/* ================= DISLIKE ================= */
app.post("/dislike",(req,res)=>{
let p = POSTS.find(x=>x.id==req.body.id);
if(!p) return res.json({ok:false});

if(!p.dislikedBy.includes(req.body.user)){
p.dislikes++;
p.dislikedBy.push(req.body.user);
}

res.json({ok:true});
});

/* ================= DELETE ================= */
app.post("/delete",(req,res)=>{
let i = POSTS.findIndex(p=>p.id==req.body.id);
if(i===-1) return res.json({ok:false});

if(req.body.pass !== ADMIN_PASS){
return res.json({ok:false,error:"wrong pass"});
}

POSTS.splice(i,1);

res.json({ok:true});
});

/* ================= CHAT ================= */
app.post("/send",(req,res)=>{

const {user,text} = req.body;

if(!text || text.trim()===""){
return res.json({ok:false});
}

MESSAGES.push({
id: Date.now(),
user,
text
});

if(MESSAGES.length>50) MESSAGES.shift();

res.json({ok:true});
});

app.get("/messages",(req,res)=>{
res.json(MESSAGES);
});

/* ================= UPLOAD ================= */
app.post("/upload", upload.single("file"), (req,res)=>{
if(!req.file) return res.json({ok:false});

res.json({
ok:true,
file:req.file.filename,
type:req.file.mimetype
});
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;

app.listen(PORT,()=>{
console.log("🚀 RUNNING " + PORT);
});
