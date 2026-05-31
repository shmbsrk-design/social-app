const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const app = express();

/* ===== FILES ===== */
const UPLOADS = path.join(__dirname,"uploads");
const DATA_FILE = path.join(__dirname,"data.json");

if(!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS);

app.use(express.json());
app.use("/uploads",express.static(UPLOADS));

const upload = multer({ dest: UPLOADS });

const ADMIN_PASS = "mbark#7171124";

/* ===== LOAD/SAVE ===== */
function loadData(){
if(!fs.existsSync(DATA_FILE)){
return {posts:[],messages:[],users:[]};
}
return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data){
fs.writeFileSync(DATA_FILE,JSON.stringify(data,null,2));
}

let DB = loadData();

/* ===== HOME ===== */
app.get("/",(req,res)=>{
res.sendFile(path.join(__dirname,"index.html"));
});

/* ===== LOGIN (اسم فقط) ===== */
app.post("/login",(req,res)=>{
res.json({ok:true});
});

/* ===== POSTS ===== */
app.post("/post",(req,res)=>{

const {user,text,file,type} = req.body;

if((!text || text.trim()==="") && !file){
return res.json({ok:false,error:"لا يمكن نشر منشور فارغ"});
}

let post = {
id: Date.now(),
user,
text: text || "",
file: file || null,
type: type || null,
likes: 0,
dislikes: 0
};

DB.posts.push(post);
saveData(DB);

res.json({ok:true});
});

app.get("/posts",(req,res)=>{
res.json(DB.posts);
});

/* ===== LIKE ===== */
app.post("/like",(req,res)=>{
let p = DB.posts.find(x=>x.id==req.body.id);
if(!p) return res.json({ok:false});

p.likes++;
saveData(DB);

res.json({ok:true});
});

/* ===== DISLIKE ===== */
app.post("/dislike",(req,res)=>{
let p = DB.posts.find(x=>x.id==req.body.id);
if(!p) return res.json({ok:false});

p.dislikes++;
saveData(DB);

res.json({ok:true});
});

/* ===== CHAT ===== */
app.post("/send",(req,res)=>{

const {user,text} = req.body;

if(!text || text.trim()===""){
return res.json({ok:false});
}

DB.messages.push({
id:Date.now(),
user,
text
});

saveData(DB);

res.json({ok:true});
});

app.get("/messages",(req,res)=>{
res.json(DB.messages);
});

/* ===== UPLOAD ===== */
app.post("/upload",upload.single("file"),(req,res)=>{
res.json({
file:req.file.filename,
type:req.file.mimetype
});
});

/* ===== START ===== */
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>console.log("🇵🇸 RUNNING "+PORT));
