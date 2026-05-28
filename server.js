const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const fs = require("fs");
const CryptoJS = require("crypto-js");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: "*" }
});

/* ================= FILE DB ================= */

const DB_FILE = "database.json";

function loadDB() {
  const data = fs.readFileSync(DB_FILE, "utf8");
  return JSON.parse(data);
}

function saveDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

/* ================= USERNAME ================= */

function generateUsername() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/* ================= USERS ================= */

app.post("/create-user", (req, res) => {
  const db = loadDB();

  const user = {
    id: Date.now().toString(),
    username: generateUsername()
  };

  db.users.push(user);
  saveDB(db);

  res.json(user);
});

app.get("/search/:name", (req, res) => {
  const db = loadDB();

  const users = db.users.filter(u =>
    u.username.toLowerCase().includes(req.params.name.toLowerCase())
  );

  res.json(users);
});

/* ================= MESSAGES ================= */

app.get("/messages/:from/:to", (req, res) => {
  const db = loadDB();

  const messages = db.messages.filter(m =>
    (m.from === req.params.from && m.to === req.params.to) ||
    (m.from === req.params.to && m.to === req.params.from)
  );

  const decrypted = messages.map(m => {
    const bytes = CryptoJS.AES.decrypt(m.text, "SECRET_KEY");
    return {
      from: m.from,
      to: m.to,
      text: bytes.toString(CryptoJS.enc.Utf8)
    };
  });

  res.json(decrypted);
});

/* ================= SOCKET ================= */

io.on("connection", (socket) => {
  console.log("utente connesso");

  socket.on("send_message", (data) => {
    const db = loadDB();

    const encrypted = CryptoJS.AES.encrypt(
      data.text,
      "SECRET_KEY"
    ).toString();

    db.messages.push({
      from: data.from,
      to: data.to,
      text: encrypted,
      createdAt: new Date()
    });

    saveDB(db);

    io.emit("receive_message", data);
  });
});

/* ================= START ================= */

server.listen(3001, () => {
  console.log("server online");
});
