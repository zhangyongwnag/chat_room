import React, {Component} from 'react'
import User from '../component/User'

export default class App extends Component {
  constructor() {
    super()
  }

  render() {
    return (
      <section>
        <div className='chat_body'>
          <User/>
          <div className='chat_body_room'>
            <div className='chat_body_room_title'>
              正在与管理员聊天...
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

module.hot ? module.hot.accept() : ''
