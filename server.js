import http from "http";
import fs from "fs";
import crypto from "crypto";
import { WebSocketServer } from "ws";

// Load saved accounts
let accounts = JSON.parse(fs.readFileSync("accounts.json"));

// Hash function
function hash(t) {
  return crypto.createHash("sha256").update(t).digest("hex");
}

// Serve HTML + JS in one file
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Chat Login System</title>
  <style>
    body { background:#111; color:white; font-family:Arial; }
    #chat { height:300px; overflow-y:scroll; background:#222; padding:10px; display:none; }
    #message { width:70%; }
    #loginBox, #registerBox { background:#222; padding:10px; width:250px; }
  </style>
</head>
<body>

<h1>Multiplayer Chat (Login Required)</h1>

<!-- LOGIN BOX -->
<div id="loginBox">
  <h3>Login</h3>
  <input id="loginUser" placeholder="Username"><br><br>
  <input id="loginPass" type="password" placeholder="Password"><br><br>
  <button onclick="login()">Login</button>
  <button onclick="showRegister()">Register</button>
</div>

<!-- REGISTER BOX -->
<div id="registerBox" style="display:none;">
  <h3>Register</h3>
  <input id="regUser" placeholder="Username"><br><br>
  <input id="regPass" type="password" placeholder="Password"><br><br>
  <button onclick="register()">Create Account</button>
  <button onclick="showLogin()">Back</button>
</div>

<!-- CHAT -->
<div id="chat"></div>

<input id="message" placeholder="Type message..." style="display:none;">
<button id="sendBtn" onclick="sendMessage()" style="display:none;">Send</button>

<script>
let ws;
let username = null;

function showRegister() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "block";
}

function showLogin() {
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("loginBox").style.display = "block";
}

function register() {
  ws.send(JSON.stringify({
    type: "register",
    user: document.getElementById("regUser").value,
    pass: document.getElementById("regPass").value
  }));
}

function login() {
  username = document.getElementById("loginUser").value;
  ws.send(JSON.stringify({
    type: "login",
    user: username,
    pass: document.getElementById("loginPass").value
  }));
}

function startChat() {
  document.getElementById("loginBox").style.display = "none";
  document.getElementById("registerBox").style.display = "none";
  document.getElementById("chat").style.display = "block";
  document.getElementById("message").style.display = "inline-block";
  document.getElementById("sendBtn").style.display = "inline-block";
}

function sendMessage() {
  ws.send(JSON.stringify({
    type: "chat",
    user: username,
    text: document.getElementById("message").value
  }));
  document.getElementById("message").value = "";
}

window.onload = () => {
  ws = new WebSocket("ws://" + location.host);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    const chat = document.getElementById("chat");

    if (msg.type === "register-success") alert("Account created!");
    if (msg.type === "register-failed") alert("Username taken!");
    if (msg.type === "login-failed") alert("Wrong username or password!");
    if (msg.type === "login-success") startChat();

    if (msg.type === "chat") {
      chat.innerHTML += "<div><b>" + msg.user + ":</b> " + msg.text + "</div>";
      chat.scrollTop = chat.scrollHeight;
    }
  };
};
</script>

</body>
</html>
`;

// HTTP server serves the chat page
const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.end(html);
});

// WebSocket server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
  ws.on("message", (raw) => {
    let msg = JSON.parse(raw.toString());

    // REGISTER USER
    if (msg.type === "register") {
      if (accounts[msg.user]) {
        ws.send(JSON.stringify({ type: "register-failed" }));
      } else {
        accounts[msg.user] = hash(msg.pass);
        fs.writeFileSync("accounts.json", JSON.stringify(accounts, null, 2));
        ws.send(JSON.stringify({ type: "register-success" }));
      }
      return;
    }

    // LOGIN USER
    if (msg.type === "login") {
      if (!accounts[msg.user] || accounts[msg.user] !== hash(msg.pass)) {
        ws.send(JSON.stringify({ type: "login-failed" }));
      } else {
        ws.send(JSON.stringify({ type: "login-success" }));
      }
      return;
    }

    // CHAT
    if (msg.type === "chat") {
      wss.clients.forEach(c => {
        if (c.readyState === 1) {
          c.send(JSON.stringify({
            type: "chat",
            user: msg.user,
            text: msg.text
          }));
        }
      });
    }
  });
});

server.listen(8080, () => {
  console.log("Server + Chat running on http://localhost:8080");
});
