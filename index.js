const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser'); // Import cookieParser
const fs = require("node:fs")

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Define the directory for static files
const publicDirectoryPath = path.join(__dirname, 'public');
console.log(publicDirectoryPath)
app.use((req, res, next)=>{
    // console.log(req.method, req.url)
    res.on("close", ()=>{
        console.log(res.statusCode, req.method, req.url)
    })
    next();
})

app.use(cookieParser());

const bypassURLs = ["signup", "about", "login"]
function checkAuthentication(req, res, next) {
    for(let url of bypassURLs){
        // console.log(req.url, )
        if ( req.url != "/"+url) continue;
        next();
        // console.log("next")
        return;
    }

    if (!req.cookies.utoken) {
        return res.redirect('/login');
    }
    next(); 
}
app.use(checkAuthentication);

app.use((req, res, next)=>{
    let url = req.url
    let filepath = path.join(publicDirectoryPath , url)
    // if ()
    console.log({filepath})
    if (!filepath.endsWith(".html") && fs.existsSync(filepath+".html")){
        res.sendFile(filepath+".html")
    } else
        next();
})
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
