import React from 'react'
import ReactDOM from 'react-dom'
import App from './pages/App'
import './assets/css/index.css'
import {Provider} from 'react-redux'
import {createStore,applyMiddleware,compose} from 'redux'
import reducer from './store'
import thunk from "redux-thunk";
import logger from 'redux-logger'

// 创建store对象
const store = createStore(
  reducer,
  compose(
    applyMiddleware(thunk),
    applyMiddleware(logger)
  )
)

// 全局监听reducer数据的改变
// store.subscribe(() => {});

ReactDOM.render(
  <Provider store={store}>
    <App/>
  </Provider>,
  document.getElementById('app'))

if (module.hot){
  module.hot.accept(() => {

  })
}
