let mongoose = require('mongoose')

// 创建 Schema
let RecordSchema = mongoose.Schema({
  user_id: String,
  user_name: String,
  room_name: String,
  chat_content: String,
  status: Number
}, {
  timestamps: {
    createdAt: 'createTime',
    updatedAt: 'updateTime'
  }
})

// 创建 Room model
let Records = mongoose.model('Records', RecordSchema)

module.exports = Records
