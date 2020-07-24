import {combineReducers} from 'redux'

import room from './reducer/room'
import records from "./reducer/records";

export default combineReducers({
  room, // 聊天室列表
  records, // 聊天记录
})
