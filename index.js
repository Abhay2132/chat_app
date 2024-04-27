const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cookieParser = require('cookie-parser'); // Import cookieParser
const fs = require("node:fs");
const formidable = require('formidable');
const {generateToken, addUser, performLogin, setCookieToken} = require("./lib/utilz.js")

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const publicDirectoryPath = path.join(__dirname, 'public');
console.log({publicDirectoryPath})

// to log every request
app.use((req, res, next) => {
    // console.log(req.method, req.url)
    res.on("close", () => {
        console.log(res.statusCode, req.method, req.url)
    })
    next();
})

app.use(cookieParser());
app.post("/login", (req, res, next) => {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        console.log({fields});
        let user_email = fields["user-email"]?.at(0)
        let password = fields["password"]?.at(0)

        if (user_email && password) {
            // const isValid = await checkLogin(user_email, password)
            // if (! isValid) return;
            const token = await performLogin(user_email, password);
            if (!token) return res.send("LOGIN FAILED <BR> <a href=/login>RETRY</a>")
            setCookieToken(res, token);
            res.redirect("/")
        }
    });
})
app.post("/register", (req, res, next) => {
    var form = new formidable.IncomingForm();
    form.parse(req, async function (err, fields, files) {
        console.log({fields});
        let user_email = fields["user-email"]?.at(0)
        let password = fields["password"]?.at(0)
        let full_name = fields["full-name"]?.at(0)

        if (user_email && password && full_name){
            const result = await addUser({user_email, password, full_name});
            if (!result) return res.send("Register Failed<br> <a href=/signup>Try Again</a>")
            res.redirect("/")
        }
        
        // res.redirect("/");
    });
})

app.get("/logout", (req, res, next)=>{
    res.cookie('utoken', '', { expires: new Date(0) });
    res.redirect("/")
})
app.get("/", (req, res)=>res.redirect("/chat"))

app.use(function checkAuthentication(req, res, next) {
    // if (req.url != "/chat") return next();
    if (req.url == "/chat" && !req.cookies.utoken) {
        return res.redirect('/login');
    }
    next();
});

app.use((req, res, next) => {
    let url = req.url
    let filepath = path.join(publicDirectoryPath, url)
    // if ()
    // console.log({ filepath })
    if (!filepath.endsWith(".html") && fs.existsSync(filepath + ".html")) {
        res.sendFile(filepath + ".html")
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
