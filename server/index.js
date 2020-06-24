let http = require('http')
let express = require('express')
let app = express()

app.use('/', (req, res) => {
  res.send('hello')
})

let server = http.listen(3000, '127.0.0.1', () => {
  let host =server.address().address
  let port =server.address().port

  console.log(`Server running at http://${host}:${port}`)
})
