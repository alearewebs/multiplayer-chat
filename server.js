// INSTALL FIRST (Replit will auto-detect):
// npm install express socket.io

const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);

app.use(express.static("public")); // Host the client folder

io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("chat message", (msg) => {
        io.emit("chat message", msg); // Send to everyone
    });

    socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
    });
});

http.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
});
