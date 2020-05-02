const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMsg, generateURL } = require('./utils/messages')
const { addUser, remUser, getUser, getUsersInRoom } = require('./utils/user')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 5000
const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))



io.on('connection', (socket) => {
    console.log("New connection")

    socket.on('join', ({ username, room }, callback) => {
        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMsg("Welcome to ShatApp"))
        socket.broadcast.to(user.room).emit('message', generateMsg(`${user.username} has joined the room`))
        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()
    })

    socket.on('sendMessage', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()

        if (filter.isProfane(message)) {
            return callback("Profanity is not allowed")
        }

        io.to(user.room).emit('message', generateMsg(user.username, message))
        callback()
    })

    socket.on('disconnect', () => {
        const user = remUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMsg(`${user.username} left this room`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })

    socket.on('location-sharing', (data, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('location-message', generateURL(user.username, `https://google.com/maps?q=${data.lat},${data.long}`))
        callback()
    })
})

server.listen(port, () => {
    console.log(`Server in up on port ${port}`)
})