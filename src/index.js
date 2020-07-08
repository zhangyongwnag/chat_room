import React from 'react'
import ReactDOM from 'react-dom'
import App from './pages/App'
import './assets/css/index.css'

ReactDOM.render(<App/>,document.getElementById('app'))

module.hot ? module.hot.accept() : ''
