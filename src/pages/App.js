import React, {Component} from 'react'
import {connect} from 'react-redux' // 中间件
import User from '../component/User'

let socket = require('socket.io-client')('http://127.0.0.1:3001')

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      userInfo: {}, // 用户信息
      NotificationStatus: false, // 桌面消息提醒
    }
  }

  componentDidMount() {
    // localStorage.removeItem('userInfo')
    // 如果本地信息不存在，则去注册，反之获取聊天列表
    if (localStorage.getItem('userInfo')) {
      let userInfo = JSON.parse(localStorage.getItem('userInfo'))
      socket.emit('login', userInfo._id)
    } else {
      this.register()
    }

    // 开启监听socket事件回调
    this.socketEvent()
    // 用户离线
    this.listenClose()

    // 请求授权消息通知
    // Notification.requestPermission().then(permission => {
    //   if (permission === 'granted') {
    //     this.setState({
    //       NotificationStatus: true
    //     })
    //   } else if (permission === 'denied') {
    //     this.setState({
    //       NotificationStatus: false
    //     })
    //   }
    // });
  }

  // 注册用户
  register = () => {
    let name = prompt('请输入用户名')
    name != null ? name = name.replace(/\s+/g, "") : ''
    if (name == null || !name) {
      this.register()
    } else if (name.length > 6) {
      alert('用户名不得超过6位')
      this.register()
    } else if (name) {
      socket.emit('chat_reg', name)
    }
  }

  // 正在输入
  inputting = () => {
    // 如果是私聊，告诉服务端用户正在输入
    if (this.props.room.room_item.status == '1') {
      socket.emit('inputting', {
        userName: this.state.userInfo.user_name,
        roomName: this.props.room.room_item.room_name,
        status: true
      })
      // 500秒后，告诉用户输入完毕
      this.debounce(this.inputtingEnd, 500)
    }
  }

  // 用户结束输入
  inputtingEnd = () => {
    socket.emit('inputting', {
      userName: this.state.userInfo.user_name,
      roomName: this.props.room.room_item.room_name,
      status: false
    })
  }

  // 发送消息
  sendMessage = () => {
    let ele = document.getElementById('message')
    // 如果用户没有输入
    if (!ele.value) return
    socket.emit('chat_message', {
      roomName: this.props.room.room_item.room_name,
      userId: this.state.userInfo._id,
      userName: this.state.userInfo.user_name,
      chat_content: ele.value,
      status: this.props.room.room_item.status
    })
    // 清空输入的文字
    ele.value = ''
  }

  // 聊天记录到达底部
  updatePosition = () => {
    let ele = document.getElementsByClassName('chat_body_room_content_scroll')[0]
    ele.scrollTop = ele.scrollHeight
  }

  // 新增私聊
  addPrivateChat = item => {
    socket.emit('add_private_chat', {
      userId: this.state.userInfo._id,
      userName: this.state.userInfo.user_name,
      userOtherId: item.user_id,
      userOtherName: item.user_name,
      status: item.status
    })
  }

  // 新消息通知
  Notification = () => {
    let n = new Notification('会话服务提醒', {
      body: '您有新的消息哦，请查收',
      tag: 'linxin',
      icon: require('../assets/img/chat_head_img.jpg'),
      requireInteraction: true
    })
  }

  // 监听浏览器刷新/关闭事件
  listenClose = () => {
    if (navigator.userAgent.indexOf('Firefox')) {
      window.onbeforeunload = () => {
        socket.emit('off_line', {
          userName: this.state.userInfo.user_name,
          userId: this.state.userInfo._id,
          roomName: this.props.room.room_item.room_name,
          status: this.props.room.room_item.status
        })
      }
    } else {
      window.onunload = () => {
        socket.emit('off_line', {
          userName: this.state.userInfo.user_name,
          userId: this.state.userInfo._id,
          roomName: this.props.room.room_item.room_name,
          status: this.props.room.room_item.status
        })
      }
    }
  }

  // socket事件回调
  socketEvent = () => {
    // 获取登录结果
    socket.on('login', socket_id => {
      let userInfo = JSON.parse(localStorage.getItem('userInfo'))
      userInfo.socket_id = socket_id
      localStorage.setItem('userInfo', JSON.stringify(userInfo))
      this.setState({
        userInfo
      }, () => {
        socket.emit('get_room_list', userInfo._id)
      })
    })
    // 获取注册结果
    socket.on('chat_reg', apply => {
      if (apply.code == 200) {
        localStorage.setItem('userInfo', JSON.stringify(apply.data))
        this.setState({
          userInfo: apply.data
        }, () => {
          socket.emit('get_room_list', this.state.userInfo._id)
        })
      } else {
        alert(apply.data)
        this.register()
      }
    })
    // 获取聊天列表
    socket.on('get_room_list', apply => {
      let room_list = apply.data.data.filter(item => item.user_id == this.state.userInfo._id)
      let room_id = room_list[0]._id.toString()
      let room_item = room_list[0]
      // 保存用户聊天室信息、列表
      this.props.dispatch({
        type: 'set',
        data: {
          room: {
            room_id,
            room_item,
          },
          room_list
        }
      })
      // 如果存在首次获取标识once，用户加入聊天室
      if (apply.data.once) {
        // 加入某个聊天室
        socket.emit('join', {
          roomName: this.props.room.room_item.room_name,
          roomId: this.props.room.room_id,
          userId: this.state.userInfo._id,
          userName: this.state.userInfo.user_name,
          status: this.props.room.room_item.status
        })
      }
    })
    // 更新聊天列表
    socket.on('room_list_all', apply => {
      this.props.dispatch({
        type: 'set',
        data: {
          room_list: apply.data.filter(item => item.user_id == this.state.userInfo._id)
        }
      })
    })
    // 获取聊天消息
    socket.on('chat_message', data => {
      if (data.data.action == 'set') {
        this.props.dispatch({
          type: 'set_records',
          data: data.data.data
        })
      } else if (data.data.action == 'add') {
        this.props.dispatch({
          type: 'add_record',
          data: data.data.data
        })
      }
      // 聊天置底
      this.updatePosition()
      // 桌面消息通知有新的消息，这里因为安全问题，https可使用
      // this.Notification()
    })
    // 获取正在输入状态
    socket.on('inputting', data => {
      // 如果用户当前所处聊天室与私聊用户处在同一聊天室
      if (this.props.room.room_item.room_name.indexOf(data.data.user_name) != -1) {
        this.setState({
          inputting: data.code == '200' ? true : false
        })
      }
    })
  }

  // 函数防抖
  debounce = (fun, delay) => {
    clearTimeout(fun.timer)
    fun.timer = setTimeout(() => {
      fun()
    }, delay)
  }

  render() {
    let {room, records} = this.props
    let {userInfo, inputting} = this.state
    return (
      <section>
        <div className='chat_body'>
          <User socket={socket} userInfo={userInfo}/>
          <div className='chat_body_room'>
            {
              inputting ?
                <div className='chat_body_room_title'>
                      <span
                        style={{color: 'rgb(13, 179, 164)'}}>{room.room_item.status ? room.room_item.room_name.replace(this.state.userInfo.user_name, '').replace('-', '') : room.room_item.room_name}</span>（
                  正在输入... ）
                </div>
                :
                <div className='chat_body_room_title'>
                  正在与<span
                  style={{color: 'rgb(13, 179, 164)'}}>{room.room_item.status ? room.room_item.room_name.replace(this.state.userInfo.user_name, '').replace('-', '') : room.room_item.room_name}</span>聊天...
                </div>
            }
            <div className='chat_body_room_content_scroll'>
              <div className='chat_body_room_content'>
                {
                  records.map((item, index) => (
                    <div key={index}>
                      {
                        item.status == '0' ?
                          <div className='chat_body_room_content_list_system_message'>
                            <span>{item.chat_content}</span>
                          </div>
                          : (
                            userInfo._id === item.user_id ?
                              <div className='chat_body_room_content_list'>
                                <div className='chat_body_room_content_list_user_info user_info_mine'>
                                  <div className='chat_body_room_content_list_user_name'
                                       style={{textAlign: 'right', marginRight: '5px'}}><span
                                    style={{marginRight: '10px'}}>{item.createTime}</span>{item.user_name}
                                  </div>
                                  <div className='chat_body_room_content_list_user_text'>{item.chat_content}</div>
                                </div>
                                <div className='chat_body_room_content_list_user'>
                                  <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
                                </div>
                              </div>
                              :
                              <div className='chat_body_room_content_list'>
                                <div className='chat_body_room_content_list_user'
                                     onClick={() => this.addPrivateChat(item)}>
                                  <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
                                </div>
                                <div className='chat_body_room_content_list_user_info'>
                                  <div className='chat_body_room_content_list_user_name'>{item.user_name}<span
                                    style={{marginLeft: '10px'}}>{item.createTime}</span>
                                  </div>
                                  <div>
                                    <span className='chat_body_room_content_list_user_text'>{item.chat_content}</span>
                                  </div>
                                </div>
                              </div>
                          )
                      }
                    </div>
                  ))
                }
              </div>
            </div>
            <div className='chat_body_room_input'>
              <div className='chat_body_room_input_warp'>
                <input id='message' type="text" placeholder='请输入聊天内容'
                       onInput={this.inputting}
                       onKeyUp={() => event.keyCode == '13' ? this.sendMessage() : ''}/>
              </div>
              <div className='chat_body_room_input_button' onClick={this.sendMessage}>点击发送</div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}

function mapStateToProps(state) {
  return {
    room: state.room.room,
    records: state.records
  }
}

export default connect(mapStateToProps)(App)


