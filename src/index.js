const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))

// let count = 0

// server (emit) -> client (receive) - countUpdated
// client (emit) -> server (recieve) - increment

io.on('connection', (socket) => {
    console.log('new websocket connection')

    // send welcome message
    // socket.emit('message', generateMessage('Welcome!'))
    // Broadcast help us to send message to all user except the one who is joining last 
    // socket.broadcast.emit('message', generateMessage('A new user has joined'))

    socket.on('Join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        // io.to.emit or socket.broadcast.to.emit is used for sending meessage for specific room
        socket.emit('message', generateMessage('Admin' , 'Welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined!`))
        io.to(user.room).emit('roomData' , {
            room: user.room,
            users: getUserInRoom(user.room)
        })

        callback()
    })

    // receive message
    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        if (user) {
            const filter = new Filter()

            if (filter.isProfane(message)) {
                return callback('Profanity is not allowed')
            }
            io.to(user.room).emit('message', generateMessage(user.username , message))
            callback()
        }
    })
    socket.on('sendLocation', (coords, callback) => {
        const user = getUser(socket.id)
        if (user) {
        let url = `https://google.com/maps?q=${coords.latitude},${coords.longitude}`
        io.to(user.room).emit('Locationmessage',generateLocationMessage(user.username , url) )
        callback()
        }
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin' , `${user.username} left the room!`))
            io.to(user.room).emit('roomData' , {
                room: user.room , 
                users: getUserInRoom(user.room)
            })
        }

    })


    // socket.emit('countUpdated' , count)
    // socket.on('increment' , () => {
    //     count = count +1
    // socket.emit is only send update on 1 connection
    // socket.emit('countUpdated' , count) 
    // io.emit is used for all connection simuntaneousky
    //         io.emit('countUpdated' , count)
    //     })
})

server.listen(port, () => {
    console.log(`Server is up on port ${port}!`)
})