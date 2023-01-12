const express = require('express');
const app = express();
const PORT = process.env.PORT || 4000;

const server = require("http").Server(app);
const io = require('socket.io')(server);

app.use(express.static('public'));
app.set('view engine', 'ejs');
app.set("views", "./views");
app.use(express.json());
app.use(express.urlencoded({extended: false}));

var registedUsers = [];
var rooms = [];
var listCmt = [];

function Comment (name, cmt) {
    this.name = name;
    this.cmt = cmt;
}

io.on("connection", (socket) => {
    console.log("Co nguoi ket noi");

    // home page
    socket.on('send-msg', (data) => {
        console.log(data);
        io.sockets.emit('server-send-msg', data)+" Danh Tuan";
    } )

    socket.on('send-msg-not', (data) => {
        console.log(data);
        socket.broadcast.emit('server-send-msg', data)+" Danh Tuan";
    } )

    socket.on("send-color" , (color) => {
        console.log(color);

        io.sockets.emit('server-send-color', color)
    })

    // chat page

    socket.on('chat-username' , (data) => {
        if(registedUsers.indexOf(data) >= 0) {
            socket.emit('user-register-failed');
        }else {
            registedUsers.push(data);
            socket.username = data;
            socket.emit('user-register-success', data);
            io.sockets.emit('server-send-list-register-user', registedUsers);
        }
    })

    socket.on('logout', () => {
        registedUsers.splice(registedUsers.indexOf(socket.username), 1);
        console.log(registedUsers);
        socket.broadcast.emit('server-send-list-register-user', registedUsers);

    })

    socket.on('chat-mgs-send', (data) => {
        console.log(data);
        io.sockets.emit('server-send-chat-msg', {
            username: socket.username,
            content: data
        });
    })

    socket.on('focus-input', () => {
        console.log('focus input');
        socket.broadcast.emit('focus-input', socket.username + " đang nhập ..... ");
    })

    socket.on('leave-input', () => {
        console.log('leave-input');
        socket.broadcast.emit('focus-input',  "");

    })

    // Room page

    socket.on('create-room', (room) => {
        socket.join(room);
        socket.rooom = room;
        rooms  = Array.from(socket.adapter.rooms.keys());

        io.sockets.emit('server-send-rooms', rooms);
        socket.emit('server-send-current-room', socket.rooom)
        socket.to(room).emit('join-room', socket.id + "joined room " + socket.rooom);

    })

    socket.on('chat', (msg) => {
        io.to(socket.rooom).emit('server-chat', {
            username: socket.id,
            msg,
        });
    })

    socket.on('join-room', (room) => {
        console.log(room)
        socket.join(room);
        socket.rooom = room;

        socket.emit('server-send-current-room', socket.rooom)
        socket.to(room).emit('join-room', socket.id + "joined room " + socket.rooom);


    })

    // list page

    socket.on('send-comment', (data) => {
        listCmt.push(new Comment(data.name, data.cmt))
        io.sockets.emit('send-list-cmt' , listCmt);
    })

    // disconnected
    socket.on("disconnect", () => {
        console.log(`${socket.id} da ngat ket noi`);

    })


  });

app.get('/', (req, res) => {
    res.render('home')
})

app.get('/chat', (req, res) => {
    res.render('chat')
})

app.get('/room', (req, res) => {
    res.render('room')
})

app.get('/list', (req, res) => {
    res.render('list')
})

server.listen(PORT, () => {    
    console.log('listening on port ' + PORT);
})