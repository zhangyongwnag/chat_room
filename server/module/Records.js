let mongoose = require('mongoose')

// 创建 Schema
let RecordSchema = mongoose.Schema({
  user_id: String, // 用户ID
  user_name: String, // 用户名称
  room_name: String, // 聊天室名称
  chat_content: String, // 聊天内容
  status: Number // 是否为系统服务消息
}, {
  timestamps: {
    createdAt: 'createTime',
    updatedAt: 'updateTime'
  }
})

// 创建 Room model
let Records = mongoose.model('Records', RecordSchema)

module.exports = Records
