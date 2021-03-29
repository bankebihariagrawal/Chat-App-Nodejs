const socket = io()

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

// templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// options
const {username , room} = Qs.parse(location.search ,{ ignoreQueryPrefix: true})

// server (emit) -> client (receive) - acknowledgement--> server
// client (emit) -> server (recieve) - acknowledgement--> client

const autoscroll = () => {
    // New Message Element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible Height
    const visibleHeight = $messages.offsetHeight

    // Height of message container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if(containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate ,{
        username: message.username,
        message: message.text,
        createdAt : moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend' , html)
    autoscroll()
})

socket.on('Locationmessage' , (url) => {
    console.log(url)
    const html = Mustache.render(locationTemplate ,{
        username: url.username , 
        url: url.url , 
        createdAt : moment(url.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend' , html)
    autoscroll()
})

// SideUserList
socket.on('roomData' , ({room , users}) => {
    const html = Mustache.render(sidebarTemplate , {
        room ,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})

// sent message to server
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    // disable

    $messageFormButton.setAttribute('disabled', 'disabled')

    // const message = document.querySelector('input').value
    const message = e.target.elements.message.value
    socket.emit('sendMessage', message, (error) => {
        // enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if (error) {
            return console.log(error)
        }
        console.log('Message delivered!')
    })
})

locationButton.addEventListener('click', () => {
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }
    locationButton.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {

            locationButton.removeAttribute('disabled')
            console.log('Location Shared!')
        })

    })
})

socket.emit('Join' , { username , room} , (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})




// socket.on('countUpdated' , (count) => {
//      console.log('The count has been updated!' , count)
// })
// document.querySelector('#increment').addEventListener('click' , () => {
//     console.log('clicked')
//     socket.emit('increment')
// })
