import React, {Component} from 'react'

export default class User extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show_tab: false, // 是否展开用户列表
    }
  }

  // 聚焦修改名称的输入框
  focusUserNameInput = () => {
    document.getElementsByClassName('username_input')[0].focus()
  }
  // 更新名称
  updateUserName = e => {
    if (e.keyCode == '13') {
      // 更新名称
      console.log(e)
    }
  }
  // 操作用户列表
  showTab = () => {
    this.setState({
      show_tab: !this.state.show_tab
    })
  }

  render() {
    let {show_tab} = this.state
    return (
      <div className='chat_body_tab' style={show_tab ? {width:'70%'} : {}}>
        <div className='chat_body_title show_text'>
          Chat room！
        </div>
        <div className='chat_body_title show_img'>
          <img src={require('../assets/img/chat_room_logo.png')} alt="" width='28px' height='28px'/>
        </div>
        <div className='chat_body_user'>
          <div className='chat_body_user_list'>
            <div className='chat_body_user_head_warp'
                 style={{padding: 0, borderBottom: '1px #f1f2f3 solid', borderRadius: 0}}>
              <div className='chat_body_user_head' style={{marginLeft: '5px'}}>
                <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
              </div>
              <div className='chat_body_user_name'>
                <p>我是一个管理员</p>
                <div>
                  <span className='circle'></span>
                  <span className='user_status'>在线</span>
                </div>
              </div>
              <div className='chat_body_user_list_message_num'>
                <span>99+</span>
              </div>
            </div>
          </div>
          <div className='chat_body_user_list'>
            <div className='chat_body_user_head_warp'
                 style={{padding: 0, borderBottom: '1px #f1f2f3 solid', borderRadius: 0}}>
              <div className='chat_body_user_head' style={{marginLeft: '5px'}}>
                <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
              </div>
              <div className='chat_body_user_name'>
                <p>我是一个管理员</p>
                <div>
                  <span className='circle'></span>
                  <span className='user_status'>在线</span>
                </div>
              </div>
              <div className='chat_body_user_list_message_num'>
                <span>23</span>
              </div>
            </div>
          </div>
          <div className='chat_body_user_list'>
            <div className='chat_body_user_head_warp'
                 style={{padding: 0, borderBottom: '1px #f1f2f3 solid', borderRadius: 0}}>
              <div className='chat_body_user_head' style={{marginLeft: '5px'}}>
                <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
              </div>
              <div className='chat_body_user_name'>
                <p>我是一个管理员</p>
                <div>
                  <span className='circle'></span>
                  <span className='user_status'>在线</span>
                </div>
              </div>
              <div className='chat_body_user_list_message_num'>
                <span>99999+</span>
              </div>
            </div>
          </div>
          <div className='chat_body_user_list'>
            <div className='chat_body_user_head_warp'
                 style={{padding: 0, borderBottom: '1px #f1f2f3 solid', borderRadius: 0}}>
              <div className='chat_body_user_head' style={{marginLeft: '5px'}}>
                <img src={require('../assets/img/chat_head_img.jpg')} alt=""/>
              </div>
              <div className='chat_body_user_name'>
                <p>我是一个管理员</p>
                <div>
                  <span className='circle'></span>
                  <span className='user_status'>在线</span>
                </div>
              </div>
              <div className='chat_body_user_list_message_num'>
                <span>10</span>
              </div>
            </div>
          </div>
        </div>
        <div className='chat_body_user_add show_text'>
          新增群聊
        </div>
        <div className='chat_body_user_add show_img'>
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
