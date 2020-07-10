let express = require('express')
let app = express()
let http = require('http').Server(app)
let io = require('socket.io')(http)
let path = require('path')
let fs = require('fs')

// let obj = {
//   room_id:'_1',
//   room_name:'所有人',
//   num:
// }

app.get('/', (req, res) => {
  res.send('hello')
})

io.on('connection', socket => {
  console.log(socket)
  // socket.broadcast.emit('所有人收到了吗')
  console.log(socket.id)
  socket.on('chat_reg', username => {
    socket.emit('chat_reg', {
      code:200,
      data:handlerChatRoomList('write', username),
      msg:'success'
    })
    // console.log(Object.keys(io.sockets.sockets))
  })
})


/***
 * @param {String} status : 读取代表read，写入代表write
 * @param {Object} username : 要写入的数据
 */

function handlerChatRoomList(status, username) {
  let userList = JSON.parse(fs.readFileSync('user_list.json').toString()) // 用户表里的数据
  let user_id = userList.length ? userList[userList.length - 1].user_id : 0 // 用户表里最后一个用户的id
  if (userList.find(item => item.user_name == username)) {
    socket.emit('chat_reg', {
      code:100,
      msg:'用户已存在'
    })
    return
  }
  userList.push({
    user_id: user_id + 1,
    user_name: username,
    register_time: new Date().toLocaleString(),
    status: 1,
    room_list: [
      {
        room_id: '_1',
        room_name: '所有人',
        num: userList.length + 1,
      }
    ]
  })
  if (status == 'write') {
    fs.writeFileSync('user_list.json', JSON.stringify(userList))
    return userList.filter(item => item.user_name == username)
  }
}

let server = http.listen(3001, '127.0.0.1', () => {
  let host = server.address().address
  let port = server.address().port

  console.log(`Server running at http://${host}:${port}`)
})
