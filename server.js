const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// OpenAI configuration
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});
const openai = new OpenAIApi(configuration);

// Serve HTML for the chat
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Multichat with Bot</title>
<style>
body { font-family: sans-serif; padding: 20px; }
#messages { list-style: none; padding: 0; max-height: 300px; overflow-y: auto; }
#messages li { margin-bottom: 10px; }
input { width: 80%; padding: 10px; }
button { padding: 10px; }
</style>
</head>
<body>
<h2>Multichat with ChatGPT-Bot 🤖</h2>
<ul id="messages"></ul>
<input id="m" autocomplete="off" placeholder="Type your message..." />
<button onclick="sendMessage()">Send</button>

<script src="/socket.io/socket.io.js"></script>
<script>
const socket = io();
const messages = document.getElementById('messages');
const input = document.getElementById('m');

socket.on('chat message', (msg) => {
  const li = document.createElement('li');
  li.textContent = msg;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});

function sendMessage() {
  if (input.value.trim() !== '') {
    socket.emit('chat message', input.value);
    input.value = '';
  }
}

input.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') sendMessage();
});
</script>
</body>
</html>
`);
});

// Socket.IO events
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Bot welcome message
  io.emit('chat message', 'ChatGPT-Bot: Hello! I am ChatGPT-Bot 🤖');

  // When user sends a message
  socket.on('chat message', async (msg) => {
    io.emit('chat message', msg); // Broadcast user message

    try {
      // Ask OpenAI API
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: "You are a helpful chatbot inside a chat room." },
          { role: "user", content: msg }
        ],
      });

      const botReply = completion.data.choices[0].message.content.trim();
      io.emit('chat message', `ChatGPT-Bot: ${botReply}`);
    } catch (err) {
      console.error(err);
      io.emit('chat message', 'ChatGPT-Bot: Sorry, something went wrong!');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
