const socket = new WebSocket(`ws://${window.location.host}`)

socket.addEventListener('open', () => {
  console.log('connected to server -- O')
})

socket.addEventListener('message', message => {
  console.log('New message: [ ', message.data, ' ] from server')
})
socket.addEventListener('close', () => {
  console.log('Disconnected to server -- X')
})

setTimeout(() => {
  socket.send('hello from the browser')
}, 3000)
