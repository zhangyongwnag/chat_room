import React,{Component} from 'react'

export default class App extends Component {
  constructor(){
    super()
  }
  render() {
    return (
      <div>Hello World</div>
    )
  }
}

module.hot ? module.hot.accept() : ''
