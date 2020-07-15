import React, {Component} from 'react'
import {connect} from 'react-redux' // 中间件
import User from '../component/User'

let socket = require('socket.io-client')('http://127.0.0.1:3001')

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      username: ''
    }
  }

  componentDidMount() {
    // 如果本地信息不存在，则去注册，反之获取聊天列表
    if (localStorage.getItem('username')) {
      this.setState({
        username: localStorage.getItem('username')
      }, () => {
        socket.emit('get_room_list', this.state.username)
      })
    } else {
      this.register()
    }

    // 开启监听socket事件回调
    this.socketEvent()
  }

  // 注册用户
  register = () => {
    let name = prompt('请输入用户名')
    if (name.length > 6) {
      alert('用户名不得超过6位')
      this.register()
    } else if (name) {
      localStorage.setItem('username', name)
      this.setState({
        username: name
      }, () => socket.emit('chat_reg', name))
    } else {
      this.register()
    }
  }

  // socket事件回调
  socketEvent = () => {
    // 获取注册结果
    socket.on('chat_reg', apply => {
      if (apply.code == 100) {
        alert(apply.data)
        this.register()
      }
    })
    // 获取聊天列表
    socket.on('get_room_list', apply => {
      let room_list = apply.data
      let room_id = room_list[0]._id
      let room_item = room_list[0]
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
    })
    socket.emit('join', {
      room_id: this.props.room.room_id,
      username: this.state.username
    })
    // 获取聊天消息
    socket.on('chat_message', data => {
      this.props.dispatch({
        type: 'set',
        data: {
          room: {}
        }
      })
    })
  }


  render() {
    let {room} = this.props
    return (
      <section>
        <div className='chat_body'>
          <User socket={socket}/>
          <div className='chat_body_room'>
            <div className='chat_body_room_title'>
              正在与<span style={{color: 'rgb(13, 179, 164)'}}>{room.room_item.room_name}</span>聊天...
            </div>
            <div className='chat_body_room_content_scroll'>
              <div className='chat_body_room_content'>
                <div className='chat_body_room_content_list'>
                  <div className='chat_body_room_content_list_user'>
                    <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
                  </div>
                  <div className='chat_body_room_content_list_user_info'>
                    <div className='chat_body_room_content_list_user_name'>小明<span style={{marginLeft: '10px'}}>2020-07-08 17:00</span>
                    </div>
                    <div className='chat_body_room_content_list_user_text'>
                      阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多
                    </div>
                  </div>
                </div>
                <div className='chat_body_room_content_list'>
                  <div className='chat_body_room_content_list_user_info user_info_mine'>
                    <div className='chat_body_room_content_list_user_name'
                         style={{textAlign: 'right', marginRight: '5px'}}><span style={{marginRight: '10px'}}>2020-07-08 17:00</span>小明
                    </div>
                    <div className='chat_body_room_content_list_user_text'>
                      阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多
                    </div>
                  </div>
                  <div className='chat_body_room_content_list_user'>
                    <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
                  </div>
                </div>
                <div className='chat_body_room_content_list_system_message'>
                  <span>管理员加入群聊</span>
                </div>
                <div className='chat_body_room_content_list'>
                  <div className='chat_body_room_content_list_user'>
                    <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
                  </div>
                  <div className='chat_body_room_content_list_user_info'>
                    <div className='chat_body_room_content_list_user_name'>小明<span style={{marginLeft: '10px'}}>2020-07-08 17:00</span>
                    </div>
                    <div className='chat_body_room_content_list_user_text'>
                      阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多
                    </div>
                  </div>
                </div>
                <div className='chat_body_room_content_list'>
                  <div className='chat_body_room_content_list_user_info user_info_mine'>
                    <div className='chat_body_room_content_list_user_name'
                         style={{textAlign: 'right', marginRight: '5px'}}><span style={{marginRight: '10px'}}>2020-07-08 17:00</span>小明
                    </div>
                    <div className='chat_body_room_content_list_user_text'>
                      阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多阿斯达所多阿斯达所多阿斯达所多啊实打实大所多阿斯达所多
                    </div>
                  </div>
                  <div className='chat_body_room_content_list_user'>
                    <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
                  </div>
                </div>
                <div className='chat_body_room_content_list_system_message'>
                  <span>小张加入群聊</span>
                </div>
              </div>
            </div>
            <div className='chat_body_room_input'>
              <div className='chat_body_room_input_warp'>
                <input type="text" placeholder='请输入聊天内容'/>
              </div>
              <div className='chat_body_room_input_button'>点击发送</div>
            </div>
          </div>
        </div>
      </section>
    )
  }
}

function mapStateToProps(state) {
  return {
    room: state.room.room
  }
}

export default connect(mapStateToProps)(App)


