let mongoose = require('mongoose')

// 创建 Schema
let RoomSchema = mongoose.Schema({
  user_id: String, // 用户ID
  user_name: String, // 用户名称
  room_name: String, // 聊天室名称
  status: Number, // 0为群聊，其他为私聊
  num: Number, // 聊天是在线人数
  badge_number: Number, // 消息未读数
  current_status: Boolean // 当前用户是否处在当前聊天室
}, {
  timestamps: {
    createdAt: 'createTime',
    updatedAt: 'updateTime'
  }
})

// 创建 Room model
let Room = mongoose.model('Room', RoomSchema)

module.exports = Room
