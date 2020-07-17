let mongoose = require('mongoose')

// 创建 Schema
let UserSchema = mongoose.Schema({
  user_name: {
    type: String,
    unique: true,
    required: true
  },
  current_room_id: String,
  socket_id: String
}, {
  timestamps: {
    createdAt: 'createTime',
    updatedAt: 'updateTime'
  }
})

// 创建 User model
let User = mongoose.model('User', UserSchema)

module.exports = User
