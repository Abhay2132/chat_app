const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Define the directory for static files
const publicDirectoryPath = path.join(__dirname, 'public');

// Serve static files from the public directory
app.use(express.static(publicDirectoryPath));

// Handle socket connections
io.on('connection', (socket) => {
  console.log('A user connected!');

  // Handle events from the client
  socket.on('message', (msg) => {
    console.log('Message received:', msg);

    // Broadcast the message to all connected clients
    socket.broadcast.emit('message', msg);
  });

  // Handle disconnections
  socket.on('disconnect', () => {
    console.log('A user disconnected!');
  });
});

// Define the port to listen on
const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
