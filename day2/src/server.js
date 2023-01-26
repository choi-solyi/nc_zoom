import express from 'express'
import http from 'http'
import { Server } from 'socket.io'
import { instrument } from '@socket.io/admin-ui'
const app = express()

app.set('view engine', 'pug')
app.set('views', __dirname + '/views')
app.use('/public', express.static(__dirname + '/public'))
app.get('/', (req, res) => res.render('home'))
// app.get('/*', (req, res) => res.render('/'))

const httpServer = http.createServer(app)
const wsServer = new Server(httpServer, {
  cors: {
    origin: ['https://admin.socket.io'],
    Credentials: true,
  },
})
instrument(wsServer, {
  auth: false,
})

function publicRooms() {
  const {
    sockets: {
      adapter: { sids, rooms },
    },
  } = wsServer
  const publicRooms = []

  rooms.forEach((_, key) => {
    if (sids.get(key) === undefined) {
      publicRooms.push(key)
    }
  })
  return publicRooms
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size
}

wsServer.on('connection', socket => {
  // onAny: middleware 개념
  socket.onAny(event => {
    console.log(`Socket event: ${event}`)
  })
  socket.on('enter_room', (roomName, done) => {
    socket['nickname'] = 'Anon'
    // console.log(socket.id)
    // console.log(socket.rooms)
    // console.log(roomName)

    // socket 입장
    socket.join(roomName)

    // callback 함수
    done('hello from the backend')

    // 방에 누군가 입장했을때
    socket.to(roomName).emit('welcome', socket.nickname, countRoom(roomName))

    // 모든 소켓에 메세지 전송
    wsServer.sockets.emit('room_change', publicRooms())
  })
  // 방에 있던 사람의 연결이 끊어졌을 때
  socket.on('disconnecting', () => {
    socket.rooms.forEach(room =>
      socket.to(room).emit('bye', socket.nickname, countRoom(room) - 1)
    )
  })

  // 방에 연결이 끊어졌을때
  socket.on('disconnect', () => {
    wsServer.sockets.emit('room_change', publicRooms())
  })

  // 방에 채팅이 추가되었을때
  socket.on('new_message', (msg, room, done) => {
    socket.to(room).emit('new_message', `${socket.nickname}: ${msg}`)
    done()
  })

  // 닉네임 저장
  socket.on('nickname', nickname => {
    socket['nickname'] = nickname
  })
})
const handleListen = () => console.log(`Listening on http://localhost:3000`)
httpServer.listen(3000, handleListen)
