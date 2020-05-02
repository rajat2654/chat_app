const socket = io()

// Elements
const form = document.querySelector('form')
const data = document.querySelector('.inp')
const msgBtn = form.querySelector('button')
const locBtn = document.querySelector('#send-loc')
const messages = document.querySelector('#messages')

// Templates
const msgTemplate = document.querySelector('#message-template').innerHTML
const locMsgTemplate = document.querySelector('#loc-msg-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })


const autoscroll = () => {
    // New message element
    const newMessage = messages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHt = newMessage.offsetHeight + newMessageMargin

    // Visible ht
    const visibleht = messages.offsetHeight

    // Ht of messages container
    const containerHt = messages.scrollHeight

    // How far have i scrolled
    const scrollOffset = messages.scrollTop + visibleht

    if (containerHt - newMessageHt <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

socket.on('message', (msg) => {
    console.log(msg)
    const html = Mustache.render(msgTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('location-message', (msg) => {
    console.log(msg)
    const html = Mustache.render(locMsgTemplate, {
        username: msg.username,
        link: msg.url,
        createdAt: moment(msg.createdAt).format('h:mm a')
    })
    messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

form.addEventListener('submit', (e) => {
    e.preventDefault()
    // disable button
    msgBtn.setAttribute('disabled', 'disabled')
    messages.scrollTop = messages.scrollHeight
    const message = data.value
    socket.emit('sendMessage', message, (error) => {
        // enable button
        msgBtn.removeAttribute('disabled')
        data.value = ''
        data.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Delivered')
    })
})

document.querySelector('#send-loc').addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    locBtn.setAttribute('disabled', 'disabled')

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('location-sharing', {
            lat: position.coords.latitude,
            long: position.coords.longitude
        }, () => {
            locBtn.removeAttribute('disabled')
            console.log("Location shared")
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})