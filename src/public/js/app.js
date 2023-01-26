const messageList = document.querySelector('ul')
const nickForm = document.querySelector('#nickname')
const messageForm = document.querySelector('#message')

const socket = new WebSocket(`ws://${window.location.host}`)

function makeMessage(type, payload) {
  const msg = { type, payload }
  return JSON.stringify(msg)
}

socket.addEventListener('open', () => {
  console.log('connected to server -- O')
})

socket.addEventListener('message', message => {
  console.log('New message: [ ', message.data, ' ] from server')
  const li = document.createElement('li')
  li.innerText = message.data
  messageList.append(li)
})
socket.addEventListener('close', () => {
  console.log('Disconnected to server -- X')
})

// setTimeout(() => {
//   socket.send('hello from the browser')
// }, 3000)

function handleSubmit(event) {
  event.preventDefault()
  const input = messageForm.querySelector('input')
  // console.log(input.value)
  socket.send(makeMessage('new_message', input.value))
  input.value = ''
}

function handleNickSubmit(event) {
  event.preventDefault()
  const input = nickForm.querySelector('input')
  socket.send(makeMessage('nickname', input.value))
}
messageForm.addEventListener('submit', handleSubmit)
nickForm.addEventListener('submit', handleNickSubmit)
