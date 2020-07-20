let mongoose = require('mongoose')

// 创建 Schema
let UserSchema = mongoose.Schema({
  // 用户名称，唯一约束
  user_name: {
    type: String,
    unique: true,
    required: true
  },
  current_room_id: String, // 用户所处聊天室ID
  socket_id: String // 用户的socketID
}, {
  timestamps: {
    createdAt: 'createTime',
    updatedAt: 'updateTime'
  }
})

// 创建 User model
let User = mongoose.model('User', UserSchema)

module.exports = User
