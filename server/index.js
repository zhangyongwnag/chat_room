let express = require('express')
let app = express()
let http = require('http').Server(app)
let io = require('socket.io')(http)
let path = require('path')
let chalk = require('chalk')
let fs = require('fs')
let mongoose = require('mongoose')
let db = 'chat' // 连接的数据库名称
let ObjectId = mongoose.Types.ObjectId // 用来处理数据库唯一约束_id为ObjectId

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
    User.updateOne({_id: ObjectId(userId)}, {$set: {socket_id: socket.id}}, function (err, result) {
      socket.emit('login', socket.id)
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
    Room.find({user_id: userId})
      .then(data => socket.emit('get_room_list', createResponse(true, {once: true, data})))
  })

  /**
   * @description 用户加入聊天室
   * @param data {
   *   {Object} leaveRoom：离开的聊天室信息
   *   {String | ObjectId} userId：当前用户ID
   *   {String | ObjectId} roomId：当前用户所处聊天室ID
   *   {String} roomName：当前用户所处聊天室名称
   *   {Number} status：0为群聊，其他为私聊
   * }
   */
  socket.on('join', data => {
    // 创建room
    data.status == '0' ? socket.join(data.roomName) : socket.join(`${data.roomName.split('-')[0]}-${data.roomName.split('-')[1]}`)
    // 找到用户的当前所在聊天室
    User.findOne({_id: ObjectId(data.userId)}, function (error, user_data) {
      // 如果用户的前后俩次聊天室一致，则不更新，反之加入成功
      if (user_data.current_room_id != data.roomId) {
        // 更新用户的当前所在聊天室
        User.updateOne({_id: ObjectId(data.userId)}, {$set: {current_room_id: data.roomId}}, function () {
          // 更新用户当前所在的聊天室状态
          Room.updateMany({user_id: data.userId}, {$set: {current_status: false}}, function () {
            Room.updateOne({_id: ObjectId(data.roomId)}, {$set: {current_status: true}}, function () {
              // 离开聊天室
              data.leaveRoom ? leaveRoom(socket, data.leaveRoom) : ''
              // 清空未读消息数
              Room.updateOne({_id: ObjectId(data.roomId)}, {$set: {badge_number: 0}}, function () {

              })
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
                  // 更新聊天室列表
                  updateRoomList()
                  // 对所有用户发送消息
                  io.sockets.in(data.roomName).emit('chat_message', createResponse(true, {
                    action: 'add',
                    data: {
                      user_id: data.userId,
                      user_name: data.userName,
                      room_name: data.roomName,
                      chat_content: `${data.userName}加入了聊天室`,
                      status: 0
                    }
                  }))
                })
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
   *   {Number} status：0为群聊，1为私聊
   * }
   */
  socket.on('off_line', data => {
    // 更新当前离线用户所处的聊天室
    User.updateOne({_id: ObjectId(data.userId)}, {$set: {current_room_id: ''}})
      .then(res => {
        // 更新当前用户所有聊天室的所处状态
        Room.updateMany({user_id: data.userId}, {$set: {current_status: false}})
          .then(res => {
            // 更新当前聊天室在线用户数
            Room.updateMany({room_name: data.roomName}, {$inc: {num: -1}})
              .then(res => {
                // 更新群聊列表
                updateRoomList()
                // 给当前聊天室用户发送离开信息，不包括自己
                socket.broadcast.to(data.roomName).emit('chat_message', createResponse(true, {
                  action: 'add',
                  data: {
                    user_id: data.userId,
                    user_name: data.userName,
                    room_name: data.roomName,
                    chat_content: `${data.userName}离开了聊天室`,
                    status: 0
                  }
                }));
                // socket离开房间
                data.status == '0' ? socket.leave(data.roomName) : socket.leave(`${data.roomName.split('-')[0]}-${data.roomName.split('-')[1]}`)
              })
          })
      })
  })

  /**
   * @description 处理聊天信息
   * @param data {
   *   {String | ObjectId} userId：当前离线用户ID
   *   {String} username：当前用户名称
   *   {String} roomName：当前用户所处聊天室名称
   *   {String} chat_content：聊天内容
   *   {Number} status：0为群聊，其他为私聊
   * }
   */
  socket.on('chat_message', data => {
    if (data.status == '0') {
      // 更新当前聊天室不在线用户的未读消息数量
      Room.updateMany({room_name: data.roomName, current_status: false}, {$inc: {badge_number: 1}})
        .then(res => {
          // 更新聊天列表
          updateRoomList()
          // 消息入库处理，并且发送消息至在线用户
          insertChatMessage({
            user_id: data.userId,
            user_name: data.userName,
            room_name: data.roomName,
            chat_content: data.chat_content,
            status: 1
          })
        })
    } else if (data.status == '1') {
      User.findOne({user_name: data.roomName.split('-')[1]})
        .then(user => {
          Room.findOne({user_id: user._id, room_name: data.roomName})
            .then(room => {
              if (room != null) {
                Room.updateOne({
                  room_name: data.roomName,
                  current_status: false
                }, {$inc: {badge_number: 1}}, function () {
                  // 更新聊天列表
                  updateRoomList()
                  // 消息入库处理，并且发送消息至在线用户
                  insertChatMessage({
                    user_id: data.userId,
                    user_name: data.userName,
                    room_name: data.roomName,
                    chat_content: data.chat_content,
                    status: 1
                  })
                  // // 发送给单个用户
                  // sendMessageSingleUser(user)
                })
              } else {
                let room = new Room({
                  user_id: user._id.toString(),
                  user_name: data.roomName.split('-')[1],
                  room_name: data.roomName,
                  status: 1,
                  num: 0,
                  badge_number: 1,
                  current_status: false
                })
                room.save()
                  .then(response => {
                    // 更新聊天列表
                    updateRoomList()
                    // 消息入库处理，并且发送消息至在线用户
                    insertChatMessage({
                      user_id: data.userId,
                      user_name: data.userName,
                      room_name: data.roomName,
                      chat_content: data.chat_content,
                      status: 1
                    })
                    // // 发送给单个用户
                    // sendMessageSingleUser(user)
                  })
              }
            })
        })
    }
  })

  /**
   * @description 新增群聊
   * @param {String} name：群聊名称
   */
  socket.on('add_group_chat', name => {
    // 如果群聊存在，添加，反之拒绝
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

  /**
   * @description 新增私聊
   * @param data {
   *   {String | ObjectId} userId：当前用户ID
   *   {String} username：当前用户名称
   *   {String} userOtherId：与之聊天的用户ID
   *   {String} userOtherName：与之聊天的用户名称
   * }
   */
  socket.on('add_private_chat', data => {
    addPrivateRoom(socket, data)
  })

  /**
   * @description 私聊监听用户输入
   * @param {String} username：当前用户名称
   * @param {String} roomName：当前聊天室名称
   * @param {Boolean} status: 用户是否正在输入
   */
  socket.on('inputting', data => {
    User.findOne({user_name: data.roomName.replace(data.userName, '').replace('-', '')})
      .then(res => {
        if (res != null) {
          res.roomName = data.roomName
          res.status = data.status
          sendMessageSingleUser(res)
        }
      })
  })
})

/**
 * @description 用户离开聊天室
 * @param {
 *    {Object} socket：socket对象
 *    {Object} data：离开聊天室的用户信息
 * }
 */
function leaveRoom(socket, data) {
  // 更新离开的聊天室在线人数
  Room.updateMany({room_name: data.roomName}, {$inc: {num: -1}}, function () {

  })
  // 给当前聊天室用户发送离开信息，不包括自己
  socket.broadcast.to(data.roomName).emit('chat_message', createResponse(true, {
    action: 'add',
    data: {
      user_id: data.userId,
      user_name: data.userName,
      room_name: data.roomName,
      chat_content: `${data.userName}离开了聊天室`,
      status: 0
    }
  }));
  // 离开聊天室
  data.status == '0' ? socket.leave(data.roomName) : socket.leave(`${data.roomName.split('-')[0]}-${data.roomName.split('-')[1]}`)
}

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
 * @description 新增私聊用户
 * @param {Object} socket：socket对象
 * @param {Object} data：新增私聊用户信息
 */
function addPrivateRoom(socket, data) {
  // 如果数据库不存在则添加，反之加入房间
  Room.find({user_id: data.userId}).where('room_name').in([`${data.userName}-${data.userOtherName}`, `${data.userOtherName}-${data.userName}`]).exec((err, roomList) => {
    if (err) return
    if (roomList.length) {
      Room.findOne({user_id: data.userId, room_name: `${data.userName}-${data.userOtherName}`})
        .then(data => {
          socket.emit('add_private_chat', createResponse(true, data))
        })
    } else {
      let room = new Room({
        user_id: data.userId.toString(),
        user_name: data.userName,
        room_name: `${data.userName}-${data.userOtherName}`,
        status: 1,
        num: 0,
        badge_number: 0,
        current_status: false
      })
      room.save()
        .then(res => {
          Room.find({user_id: data.userId})
            .then(result => {
              socket.emit('room_list_all', createResponse(true, result))
              socket.emit('add_private_chat', createResponse(true, result.filter(item => item.room_name == `${data.userName}-${data.userOtherName}`)[0]))
            })
        })
    }
  })
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
      sendMessageRoomUser(data)
    })
    .catch(err => {
      console.log('插入失败')
    })
}

/**
 * @description 给当前聊天室用户发消息
 * @param {Object} data：插入的聊天记录
 */
function sendMessageRoomUser(data) {
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
 * @description 给某个用户发消息
 * @param user：用户信息
 */
function sendMessageSingleUser(user) {
  // 如果用户不在线的话，不推送（在用户离线时，我们把他的current_room_id设置为空）
  if (user.current_room_id) {
    Room.find({user_id: user._id}, function (err, data) {
      io.sockets.sockets[user.socket_id].emit('inputting', createResponse(user.status, user))
    })
  }
}

/**
 * @description 更新聊天列表
 */
function updateRoomList() {
  Room.find({})
    .then(docs => io.sockets.emit('room_list_all', createResponse(true, docs)))
}

/**
 * @description 启动服务器，因为绑定了socket.io服务端，这里要监听http服务，请勿express服务代替监听
 */
let server = http.listen(3001, '127.0.0.1', () => {
  let host = server.address().address
  let port = server.address().port

  console.log()
  console.log(chalk.bgGreen(chalk.black(' DONE ')) + chalk.green(` Compiled successfully at `) + chalk.blue(`${new Date().toLocaleString()}`))
  console.log()
  console.log(chalk.bgBlue(chalk.black(' I ')) + ` Server running at : http://${host}:${port}`)
})
