const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

/* ================= FILES ================= */
const UPLOADS = path.join(__dirname,"uploads");
if(!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS);

const DATA_FILE = path.join(__dirname,"data.json");

app.use(express.json());
app.use("/uploads",express.static(UPLOADS));

const upload = multer({ dest: UPLOADS });

const ADMIN_PASS = "mbark#7171124";

/* ================= LOAD DATA ================= */
function load(){
if(!fs.existsSync(DATA_FILE)){
return {posts:[],messages:[]};
}
return JSON.parse(fs.readFileSync(DATA_FILE));
}

function save(data){
fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2));
}

/* ================= DATA ================= */
let DATA = load();

/* ================= HOME ================= */
app.get("/",(req,res)=>{
res.sendFile(path.join(__dirname,"index.html"));
});

/* ================= LOGIN SAVE ================= */
app.post("/login",(req,res)=>{
res.json({ok:true});
});

/* ================= POSTS ================= */
app.post("/post",(req,res)=>{

const {user,text,file,type}=req.body;

if((!text||text.trim()==="") && !file){
return res.json({ok:false});
}

let post={
id:Date.now(),
user,
text:text||"",
file:file||null,
type:type||null,
likes:0,
dislikes:0
};

DATA.posts.push(post);
save(DATA);

res.json({ok:true,post});
});

app.get("/posts",(req,res)=>{
res.json(DATA.posts);
});

/* ================= CHAT ================= */
app.post("/send",(req,res)=>{

const {user,text}=req.body;

if(!text||text.trim()===""){
return res.json({ok:false});
}

DATA.messages.push({
id:Date.now(),
user,
text
});

save(DATA);

res.json({ok:true});
});

app.get("/messages",(req,res)=>{
res.json(DATA.messages);
});

/* ================= LIKE ================= */
app.post("/like",(req,res)=>{
let p=DATA.posts.find(x=>x.id==req.body.id);
if(!p) return res.json({ok:false});

p.likes++;
save(DATA);
res.json({ok:true});
});

/* ================= DISLIKE ================= */
app.post("/dislike",(req,res)=>{
let p=DATA.posts.find(x=>x.id==req.body.id);
if(!p) return res.json({ok:false});

p.dislikes++;
save(DATA);
res.json({ok:true});
});

/* ================= DELETE ================= */
app.post("/delete",(req,res)=>{
if(req.body.pass!==ADMIN_PASS){
return res.json({ok:false});
}

DATA.posts = DATA.posts.filter(p=>p.id!=req.body.id);
save(DATA);

res.json({ok:true});
});

/* ================= UPLOAD ================= */
app.post("/upload",upload.single("file"),(req,res)=>{
res.json({
file:req.file.filename,
type:req.file.mimetype
});
});

/* ================= START ================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log("🔥 RUN "+PORT));
