const express   = require('express'),
      http      = require('http'),
      helmet    = require('helmet')

// local
const socket = require('./socket')

let app = express() 
app.use(helmet())
let port = process.env.PORT || 3000

app.get('/', (req, res) => {
  res.send('Hello World')
})

let server = http.createServer(app)
let serverOnPort = server.listen(port, u => console.log('up and running'))

socket.init(serverOnPort)