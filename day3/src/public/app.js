const socket = io()

const myFace = document.getElementById('myFace')
const muteBtn = document.getElementById('mute')
const cameraBtn = document.getElementById('camera')
const camerasSelect = document.getElementById('cameras')

const chat = document.getElementById('chat')
const msgForm = chat.querySelector('#msg')
msgForm.addEventListener('submit', handleMessageSubmit)

const ul = document.querySelector('ul')
const call = document.getElementById('call')

call.hidden = true
chat.hidden = true

let myStream
let muted = false
let cameraOff = false
let roomName
let myPeerConnection
let myDataChannel

async function getCameras() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const myCameras = devices.filter(device => device.kind === 'videoinput')
    const currentCamera = myStream.getVideoTracks()[0]
    myCameras.forEach(camera => {
      const option = document.createElement('option')
      option.value = camera.deviceId
      option.innerText = camera.label
      if (currentCamera.label === camera.label) {
        option.selected = true
      }
      camerasSelect.appendChild(option)
    })
  } catch (e) {
    console.log(e)
  }
}
async function getMedia(myDeviceId) {
  const initialConstrains = {
    audio: true,
    video: { facingMode: 'user' },
  }
  const cameraConstrains = {
    audio: true,
    video: { deviceId: { exact: myDeviceId } },
  }
  try {
    myStream = await navigator.mediaDevices.getUserMedia(
      myDeviceId ? cameraConstrains : initialConstrains
    )
    myFace.srcObject = myStream
    if (!myDeviceId) {
      await getCameras()
    }
  } catch (e) {
    console.log(e)
  }
}
// getMedia();

function handleMuteBtnClick() {
  myStream.getAudioTracks().forEach(track => (track.enabled = !track.enabled))
  if (!muted) {
    muteBtn.innerText = '소리 켜기'
    muted = true
  } else {
    muteBtn.innerText = '음소거'
    muted = false
  }
}

function handleCameraBtnClick() {
  myStream.getVideoTracks().forEach(track => (track.enabled = !track.enabled))
  if (cameraOff) {
    cameraBtn.innerText = 'CAMERA OFF'
    cameraOff = false
  } else {
    cameraBtn.innerText = 'CAMERA ON'
    cameraOff = true
  }
}
async function handleCameraChange() {
  await getMedia(camerasSelect.value)
  if (myPeerConnection) {
    const videoTrack = myStream.getVideoTracks()[0]
    const videoSender = myPeerConnection
      .getSenders()
      .find(sender => sender.track.kind === 'video')
    videoSender.replaceTrack(videoTrack)
  }
}
muteBtn.addEventListener('click', handleMuteBtnClick)
cameraBtn.addEventListener('click', handleCameraBtnClick)
camerasSelect.addEventListener('input', handleCameraChange)

// Welcome from (join a room)
const welcome = document.getElementById('welcome')
const welcomeForm = welcome.querySelector('form')
async function initCall() {
  welcome.hidden = true
  call.hidden = false
  chat.hidden = false
  await getMedia()
  makeConnection()
}

async function handleWelcomeSubmit(event) {
  event.preventDefault()
  const input = welcome.querySelector('input')
  await initCall()
  socket.emit('join_room', input.value)
  roomName = input.value
  input.value = ''
}
welcomeForm.addEventListener('submit', handleWelcomeSubmit)

//socket code

// Peer A에서만 작동
socket.on('welcome', async () => {
  myDataChannel = myPeerConnection.createDataChannel('chat')
  myDataChannel.addEventListener('message', event => {
    addMessage(`상대:${event.data}`)
  })
  console.log('made data channel')
  const offer = await myPeerConnection.createOffer()
  myPeerConnection.setLocalDescription(offer)
  console.log('A', offer)
  socket.emit('offer', offer, roomName)
})

// Peer B에서만 작동
socket.on('offer', async offer => {
  console.log('received the offer')
  myPeerConnection.addEventListener('datachannel', event => {
    myDataChannel = event.channel
    myDataChannel.addEventListener('message', event => {
      addMessage(`상대:${event.data}`)
    })
  })
  myPeerConnection.setRemoteDescription(offer)
  const answer = await myPeerConnection.createAnswer()
  myPeerConnection.setLocalDescription(answer)
  socket.emit('answer', answer, roomName)
  console.log('sent the answer')
})

socket.on('answer', answer => {
  console.log('received the answer')
  myPeerConnection.setRemoteDescription(answer)
})

socket.on('ice', ice => {
  console.log('received candidate')
  myPeerConnection.addIceCandidate(ice)
})

// RTC Code
function makeConnection() {
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
        ],
      },
    ],
  })
  myPeerConnection.addEventListener('icecandidate', handleIce)
  myPeerConnection.addEventListener('addstream', handleAddStream)
  myStream.getTracks().forEach(track => {
    myPeerConnection.addTrack(track, myStream)
  })
}

function handleIce(data) {
  console.log('sent candidate')
  socket.emit('ice', data.candidate, roomName)
  // console.log("Got Ice candidate");
  // console.log(data);
}

function handleAddStream(data) {
  console.log('got an event from my peer')
  const peerFace = document.getElementById('peerFace')
  peerFace.srcObject = data.stream
}

function handleMessageSubmit(event) {
  event.preventDefault()
  const input = chat.querySelector('#msg input')
  myDataChannel.send(input.value)
  addMessage(`내가보낸 : ${input.value}`)
  input.value = ''
}

function addMessage(message) {
  const li = document.createElement('li')
  li.innerText = message
  ul.appendChild(li)
}
