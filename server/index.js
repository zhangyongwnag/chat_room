let express = require('express')
let app = express()
let http = require('http').Server(app)
let io = require('socket.io')(http)
let path = require('path')
let chalk = require('chalk')
let fs = require('fs')
let mongoose = require('mongoose')
let db = 'chat' // 连接的数据库名称

// 设置数据库可使用唯一约束
mongoose.set('useCreateIndex', true)
// 连接数据库
mongoose.connect(`mongodb://127.0.0.1:27017/${db}`, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
  console.log()
  if (err) {
    console.log(chalk.bgCyan(chalk.black(' S ')) + chalk.red(' Connect') + chalk.blue(` db.${db}`) + chalk.red(' failure'))
  } else {
    console.log(chalk.bgCyan(chalk.black(' S ')) + chalk.green(' Connect') + chalk.blue(` db.${db}`) + chalk.green(' successfully'))
  }
})

let User = require('./module/User')
let Room = require('./module/Room')

app.get('/', (req, res) => {
  res.send('hello')
})

io.on('connection', socket => {
  // 注册事件
  socket.on('chat_reg', username => {
    let user = new User({
      user_name: username,
      current_room_id: '_1',
    })
    user.save()
      .then(res => {
        let room = new Room({
          user_id: res._id,
          user_name: username,
          room_name: '所有人',
          status: 0,
          num: 0,
          badge_number: 0
        })
        room.save()
          .then(response => {
            socket.emit('get_room_list', createResponse(true, [response]))
          })
      })
      .catch(err => {
        socket.emit('chat_reg', createResponse(false, '注册失败，用户已注册'))
      })
  })
  // 请求数据
  socket.on('get_room_list', username => {
    Room.find({user_name:username}, function (err, docs) {
      if (err) return
      socket.emit('get_room_list', createResponse(true, docs))
    })
  })
  // 加入聊天室
  // socket.on('join', data => {
  //   socket.join(data.room_id)
  //   io.sockets.in(data.room_id).emit('chat_message', createResponse(true, data.username))
  //   handlerChatRoomList('write', data.username, data.room_id)
  // })
})


/***
 * @description 处理要返回的json数据
 * @param {String} status : 读取代表read，写入代表write，首次代表once
 * @param {Object} username : 要写入的数据
 * @param {String} roomId : 用户当前所处聊天室，默认所有人
 */

function handlerChatRoomList(status, username, roomId) {
  // 用户表里的数据
  let userList = [...JSON.parse(fs.readFileSync('user_list.json').toString())]
  if (status == 'once') {
    // 用户表里最后一个用户的id
    let user_id = userList.length ? userList[userList.length - 1].user_id : 0
    // 如果用户列表无重复，写入新增用户，并且返回当前用户默认聊天列表
    if (userList.find(item => item.user_name == username)) {
      return {
        status: false,
        data: '用户已注册'
      }
    } else {
      userList.push({
        user_id: user_id + 1,
        user_name: username,
        register_time: new Date().toLocaleString(),
        current_room_id: '_1',
        room_list: [
          {
            room_id: '_1',
            room_name: '所有人',
            status: 0,
            num: 0,
            badge_number: 0
          }
        ]
      })
      userList.map(item => item.room_list.map(child => child.num = userList.length))
      fs.writeFileSync('user_list.json', JSON.stringify(userList))
      return {
        status: true,
        data: userList
      }
    }
  } else if (status == 'read') {
    return {
      status: true,
      data: userList.filter(item => item.user_name == username)
    }
  } else if (status == 'write') {
    userList.map(item => {
      if (item.current_room_id == roomId) {
        item.room_list.map(child => child.badge_number++)
      }
    })
    fs.writeFileSync('user_list.json', JSON.stringify(userList))
    sendMessageAllUser(userList)
  }
}

/**
 * @description 创建响应体
 * @param {Boolean} status : 是否成功
 * @param {String | Array} data : 返回的数据
 */

function createResponse(status, data) {
  return {
    code: status ? 200 : 100,
    data,
    msg: status ? 'success' : 'error'
  }
}

/**
 * @description 给所有用户发消息
 */

function sendMessageAllUser(data) {
  io.sockets.emit('get_room_list', createResponse(true, data))
}

/**
 * @description 保存表
 */
function saveModel(model) {
  model.save()
    .then(res => console.log(chalk.red('保存成功')))
    .catch(err => console.log(chalk.red('保存失败')))
}


let server = http.listen(3001, '127.0.0.1', () => {
  let host = server.address().address
  let port = server.address().port

  console.log()
  console.log(chalk.bgGreen(chalk.black(' DONE ')) + chalk.green(` Compiled successfully at `) + chalk.blue(`${new Date().toLocaleString()}`))
  console.log()
  console.log(chalk.bgBlue(chalk.black(' I ')) + ` Server running at : http://${host}:${port}`)
})
