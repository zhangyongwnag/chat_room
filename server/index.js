let express = require('express')
let app = express()
let http = require('http').Server(app)
let io = require('socket.io')(http)
let path = require('path')
let chalk = require('chalk')
let fs = require('fs')
let mongoose = require('mongoose')
let db = 'chat' // 连接的数据库名称
let ObjectId = mongoose.Types.ObjectId

// 设置数据库可使用唯一约束
mongoose.set('useCreateIndex', true)
// 连接数据库
mongoose.connect(`mongodb://192.168.43.149:27017/${db}`, {useNewUrlParser: true, useUnifiedTopology: true}, err => {
  console.log()
  if (err) {
    console.log(chalk.bgCyan(chalk.black(' S ')) + chalk.red(' Connect') + chalk.blue(` db.${db}`) + chalk.red(' failure'))
  } else {
    console.log(chalk.bgCyan(chalk.black(' S ')) + chalk.green(' Connect') + chalk.blue(` db.${db}`) + chalk.green(' successfully'))
  }
})

let User = require('./module/User')
let Room = require('./module/Room')
let Records = require('./module/Records')

app.get('/', (req, res) => {
  res.send('hello')
})

io.on('connection', socket => {
  /**
   * @description 用户静默登录
   * @param {String | ObjectId} userId：登录的用户id
   */
  socket.on('login', userId => {
    // 更新用户列表socketId
    User.updateOne({_id: userId}, {$set: {socket_id: socket.id}}, function () {
      console.log('登录更新成功')
    })
  })

  /**
   * @description 用户注册
   * @param {String} username：要注册的用户名称
   */
  socket.on('chat_reg', username => {
    let user = new User({
      user_name: username,
      current_room_id: '',
      socket_id: socket.id
    })
    // 注册用户插入数据库
    user.save()
      .then(res => {
        // 注册事件
        socket.emit('chat_reg', createResponse(true, res))
        let room = new Room({
          user_id: res._id.toString(),
          user_name: username,
          room_name: '所有人',
          status: 0,
          num: 0,
          badge_number: 0,
          current_status: false
        })
        // 默认所有人聊天室插入数据库
        room.save()
          .then(response => {
            // 首次发送用户聊天室列表
            socket.emit('get_room_list', createResponse(true, {once: true, data: [response]}))
          })
      })
      .catch(err => {
        // 注册失败
        socket.emit('chat_reg', createResponse(false, '注册失败，用户已注册'))
      })
  })

  /**
   * @description 请求聊天列表
   * @param {String | ObjectId} userId：用户ID
   */
  socket.on('get_room_list', userId => {
    Room.find({user_id: userId}, function (err, docs) {
      if (err) return
      socket.emit('get_room_list', createResponse(true, {once: true, data: docs}))
    })
  })

  /**
   * @description 用户退出/加入聊天室
   * @param data {
   *   {String | ObjectId} userId：当前离线用户ID
   *   {String | ObjectId} roomId：当前用户所处聊天室ID
   *   {String} roomName：当前用户所处聊天室名称
   * }
   */
  socket.on('join', data => {
    // 创建room
    socket.join(data.roomName)
    // 找到用户的当前所在聊天室
    User.findOne({_id: ObjectId(data.userId)}, function (error, user_data) {
      // 如果用户的前后俩次聊天室一致，则不更新，反之加入成功
      if (user_data.current_room_id != data.roomId) {
        // 更新用户的当前所在聊天室
        User.updateOne({_id: ObjectId(data.userId)}, {$set: {current_room_id: data.roomId}}, function () {
          // 更新用户当前所在的聊天室状态
          Room.updateOne({_id: ObjectId(data.roomId)}, {$set: {current_status: true}}, function () {
            // 根据当前聊天室获取聊天记录
            Records.find({room_name: data.roomName}, function (record_err, records) {
              if (record_err) return
              socket.emit('chat_message', createResponse(true, {
                action: 'set',
                data: records
              }))
            })
            // 获取当前聊天室在线的人数
            Room.find({room_name: data.roomName, current_status: true}, function (e, current_room_list) {
              // 更新当前聊天室在线的人数
              Room.updateMany({room_name: data.roomName}, {
                $set: {num: current_room_list.length}
              }, function () {
                // 更新当前聊天室不在线用户的未读消息数量
                Room.updateMany({
                    room_name: data.roomName,
                    current_status: false
                  }, {$inc: {badge_number: 1}}, function () {
                    // 更新聊天室列表
                    updateRoomList()
                    // 对所有用户发送消息
                    insertChatMessage({
                      user_id: data.userId,
                      user_name: data.userName,
                      room_name: data.roomName,
                      chat_content: `${data.userName}加入了聊天室`,
                      status: 0
                    })
                  }
                )
              })
            })
          })
        })
      }
    })
  })

  /**
   * @description 用户离线
   * @param data {
   *   {String | ObjectId} userId：当前离线用户ID
   *   {String} roomName：当前用户所处聊天室名称
   * }
   */
  socket.on('off_line', data => {
    // 更新当前离线用户所处的聊天室
    User.updateOne({_id: ObjectId(data.userId)}, {$set: {current_room_id: ''}}, function () {
      // 更新当前用户所有聊天室的所处状态
      Room.updateMany({user_id: data.userId}, {$set: {current_status: false}}, function () {
        // 更新当前聊天室在线用户数
        Room.updateMany({room_name: data.roomName}, {$inc: {num: -1}}, function () {
          updateRoomList()
        })
      })
    })
  })

  /**
   * @description 收到聊天信息
   * @param data {
   *   {String | ObjectId} userId：当前离线用户ID
   *   {String} username：当前用户名称
   *   {String} roomName：当前用户所处聊天室名称
   *   {String} chat_content：聊天内容
   * }
   */
  socket.on('chat_message', data => {
    insertChatMessage({
      user_id: data.userId,
      user_name: data.userName,
      room_name: data.roomName,
      chat_content: data.chat_content,
      status: 1
    })
  })

  /**
   * @description 新增群聊
   * @param {String} name：群聊名称
   */
  socket.on('add_group_chat', name => {
    Room.findOne({room_name: name})
      .then(res => {
        if (res == null) {
          return res
        } else {
          socket.emit('add_group_chat', createResponse(false, '群聊已存在，请重新添加'))
        }
      })
      .then(res => {
        User.find({})
          .then(data => {
            let promise = []
            data.map(item => {
              let room = new Room({
                user_id: item._id.toString(),
                user_name: item.user_name,
                room_name: name,
                status: 0,
                num: 0,
                badge_number: 0,
                current_status: false
              })
              // 默认所有人聊天室插入数据库
              promise.push(room.save())
            })
            // 并发执行
            Promise.all(promise)
              .then(result => {
                updateRoomList()
                socket.emit('add_group_chat', createResponse(true, result))
              })
          })
      })
  })
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
 * @param {String | Array | Object | Boolean | Number | Symbol} data : 返回的数据
 */
function createResponse(status, data) {
  return {
    code: status ? 200 : 100,
    data,
    msg: status ? 'success' : 'error'
  }
}

/**
 * @description 插入聊天记录数据
 * @param data {
 *   {String | ObjectId} userId：用户ID
 *   {String} username：用户名称
 *   {String} roomName：聊天室名称
 *   {String} chat_content：；聊天内容
 *   {Number} status：0是系统消息，其他代表用户消息
 * }
 */
function insertChatMessage(data) {
  let record = new Records(data)
  record.save()
    .then(res => {
      sendMessageRoom(data)
    })
    .catch(err => {
      console.log('插入失败')
    })
}

/**
 * @description 给当前聊天室用户发消息
 * @param {Object} data：插入的聊天记录
 */
function sendMessageRoom(data) {
  io.sockets.in(data.room_name).emit('chat_message', createResponse(true, {
    action: 'add',
    data,
  }))
}

/**
 * @description 给所有用户发消息
 */
function sendMessageAllUser(data) {
  io.sockets.emit('get_room_list', createResponse(true, data))
}

/**
 * @description 更新聊天列表
 */
function updateRoomList() {
  Room.find({}, function (err, docs) {
    if (err) return
    io.sockets.emit('room_list_all', createResponse(true, docs))
  })
}

/**
 * @description 启动服务器，因为绑定了socket.io服务端，这里要监听http服务，请勿express服务代替监听
 */
let server = http.listen(3001, '192.168.43.149', () => {
  let host = server.address().address
  let port = server.address().port

  console.log()
  console.log(chalk.bgGreen(chalk.black(' DONE ')) + chalk.green(` Compiled successfully at `) + chalk.blue(`${new Date().toLocaleString()}`))
  console.log()
  console.log(chalk.bgBlue(chalk.black(' I ')) + ` Server running at : http://${host}:${port}`)
})
