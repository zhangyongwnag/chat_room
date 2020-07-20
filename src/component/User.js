import React, {Component} from 'react'
import {connect} from 'react-redux' // 中间件

class User extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show_tab: false, // 是否展开用户列表
    }
  }

  componentDidMount() {
    // socket事件回调
    this.socketEvent()
  }

  // 操作用户列表
  showTab = () => {
    this.setState({
      show_tab: !this.state.show_tab
    })
  }

  // 点击聊天
  handlerClickItem = (item, index) => {
    let leaveRoom = {
      roomName: this.props.room.room_item.room_name,
      roomId: this.props.room.room_id,
      userId: this.props.userInfo._id,
      userName: this.props.userInfo.user_name
    }
    this.props.dispatch({
      type: 'set',
      data: {
        room: {
          room_id: item._id,
          room_item: item
        }
      }
    })
    this.props.socket.emit('join', {
      leaveRoom,
      roomName: item.room_name,
      roomId: item._id,
      userId: this.props.userInfo._id,
      userName: this.props.userInfo.user_name
    })
  }

  // 新增群聊
  addGroupChat = () => {
    let group_name = prompt('请输入群聊名称')
    group_name != null ? group_name = group_name.replace(/\s+/g, "") : ''
    if (group_name == null || !group_name) {
      this.addGroupChat()
    } else if (group_name.length > 6) {
      alert('群聊名称不得大于6位')
      this.addGroupChat()
    } else if (group_name) {
      this.props.socket.emit('add_group_chat', group_name)
    }
  }

  // socket事件回调
  socketEvent = () => {
    // 新增群聊
    this.props.socket.on('add_group_chat', data => {
      if (data.code == '100') {
        alert(data.data)
        this.addGroupChat()
      } else {
        // 模拟点击
        this.handlerClickItem(data.data.filter(item => item.user_id == this.props.userInfo._id)[0])
      }
    })
    // 新增私聊
    this.props.socket.on('add_private_chat', data => {
      // 模拟点击
      this.handlerClickItem(data.data)
    })
  }

  render() {
    let {show_tab} = this.state
    let {room, room_list} = this.props
    return (
      <div className='chat_body_tab' style={show_tab ? {width: '70%'} : {}}>
        <div className='chat_body_title show_text'>
          我的昵称：<span style={{color: '#0db3a4', fontWeight: 'bold'}}>{room.room_item.user_name || 'Chat room！'}</span>
        </div>
        <div className='chat_body_title show_img'>
          <img src={require('../assets/img/chat_room_logo.png')} alt="" width='28px' height='28px'/>
        </div>
        <div className='chat_body_user'>
          {
            room_list.map((item, index) => (
              <div className='chat_body_user_list' key={index} onClick={() => this.handlerClickItem(item, index)}
                   style={room.room_id === item._id ? {backgroundColor: 'rgba(0,0,0,0.1)'} : {}}>
                <div className='chat_body_user_head_warp'
                     style={{padding: 0, borderBottom: '1px #f1f2f3 solid', borderRadius: 0}}>
                  <div className='chat_body_user_head' style={{marginLeft: '5px'}}>
                    <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
                  </div>
                  <div className='chat_body_user_name'>
                    <p>{item.room_name}</p>
                    {
                      item.status ?
                        <div>
                          <span style={!item.current_status ? {backgroundColor: 'darkgray'} : {}}
                                className='circle'></span>
                          <span style={!item.current_status ? {color: 'darkgray'} : {}}
                                className='user_status'>{item.current_status ? '在线' : '离线'}</span>
                        </div>
                        :
                        <div>
                          <span className='circle'></span>
                          <span className='user_status'>在线：{item.num} 个</span>
                        </div>
                    }
                  </div>
                  {
                    item.badge_number > 0 ?
                      <div className='chat_body_user_list_message_num'>
                        <span>{item.badge_number > 99 ? '99+' : item.badge_number}</span>
                      </div>
                      : ''
                  }
                </div>
              </div>
            ))
          }
        </div>
        <div className='chat_body_user_add show_text' onClick={this.addGroupChat}>
          新增群聊
        </div>
        <div className='chat_body_user_add show_img' onClick={this.addGroupChat}>
          <img src={require('../assets/img/add_chat_room.png')} alt="" width='20px' height='20px'/>
        </div>
        {
          !show_tab ?
            <div className='chat_body_tab_show' onClick={this.showTab}>
              <img src={require('../assets/img/show_user_icon.png')} alt="" width='27px'/>
            </div>
            :
            <div className='chat_body_tab_show' onClick={this.showTab}>
              <img src={require('../assets/img/hidden_user_icon.png')} alt="" width='35px'/>
            </div>
        }
      </div>
    )
  }
}

function mapStateToProps(state) {
  return {
    room: state.room.room,
    room_list: state.room.room_list,
  }
}

export default connect(mapStateToProps)(User)
