import {combineReducers} from 'redux'

import room from './reducer/room'
import records from "./reducer/records";

export default combineReducers({
  room,
  records
})
