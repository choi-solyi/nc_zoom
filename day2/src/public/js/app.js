const socket = io()

const welcome = document.getElementById('welcome')
const form = document.querySelector('form')
const room = document.getElementById('room')

room.hidden = true

let roomName

function addMessage(message) {
  const ul = room.querySelector('ul')
  const li = document.createElement('li')
  li.innerText = message
  ul.appendChild(li)

  const form = room.querySelector('form')
  form.addEventListener('submit', handleMessageSubmit)
}

function handleMessageSubmit(event) {
  event.preventDefault()
  const input = room.querySelector('#msg input')
  socket.emit('new_message', input.value, roomName, () => {
    addMessage(`You: ${input.value}`)
    input.value = ''
  })
}
function handleNicknameSubmit(event) {
  event.preventDefault()
  const input = room.querySelector('#name input')
  socket.emit('nickname', input.value)
}

function showRoom() {
  welcome.hidden = true
  room.hidden = false
  const h3 = room.querySelector('h3')
  h3.innerText = `RoomName : ${roomName} `

  const msgForm = room.querySelector('#msg')
  const nameForm = room.querySelector('#name')
  msgForm.addEventListener('submit', handleMessageSubmit)
  nameForm.addEventListener('submit', handleNicknameSubmit)
}

function handleRoomSubmit(event) {
  event.preventDefault()
  const input = form.querySelector('input')

  // socket.io 에서는 send 가 아닌 emit을 사용한다.
  socket.emit('enter_room', input.value, showRoom)
  roomName = input.value
  input.value = ''
}

form.addEventListener('submit', handleRoomSubmit)

// backend에서 socket.to(roomName).emit('welcome')을 받아옴
socket.on('welcome', (user, newCount) => {
  const h3 = room.querySelector('h3')
  h3.innerText = `RoomName : ${roomName} (${newCount})`
  addMessage(`${user} arrived! `)
})

socket.on('bye', (user, newCount) => {
  const h3 = room.querySelector('h3')
  h3.innerText = `RoomName : ${roomName} (${newCount})`
  addMessage(`${user} left `)
})

socket.on('new_message', addMessage)

socket.on('room_change', rooms => {
  const roomList = welcome.querySelector('ul')
  roomList.innerHTML = ''
  rooms.forEach(room => {
    const li = document.createElement('li')
    li.innerText = room
    roomList.append(li)
  })
})
