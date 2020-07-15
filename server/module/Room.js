let mongoose = require('mongoose')

// 创建 Schema
let RoomSchema = mongoose.Schema({
  user_id: '',
  user_name:'',
  room_name: String,
  status: Number,
  num: Number,
  badge_number: Number
}, {
  timestamps: {
    createdAt: 'createTime',
    updatedAt: 'updateTime'
  }
})

// 创建 Room model
let Room = mongoose.model('Room', RoomSchema)

// Room.find({room_name: '所有人'}, function (err, docs) {
//   if (err) return
//   if (!docs.length) {
//     // 默认所有人群聊
//     let room = new Room({
//       room_name: '所有人',
//
//     })
//     room.save()
//       .then(res => console.log('聊天室初始化成功'))
//       .catch(err => console.log('聊天室初始化失败'))
//   }
// })

module.exports = Room
