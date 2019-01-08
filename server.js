const http = require('http'),
      express = require('express'),
      helmet = require('helmet')

// const fs   = require('fs')
// const path = require('path')

const socket = require('./socket')

// let credentials = {
//   cert: fs.readFileSync(path.join(__dirname, 'key/cert.pem')),
//   key: fs.readFileSync(path.join(__dirname, 'key/private-key.pem')),
// }

// let PORT = process.env.PORT || 3000
// let server = express()


// server.get('/', (req, res) => res.end('Hello my friend!'))
  
// server.listen(3000, u => console.log(`Listening on port ${ PORT }`))

// socket.init(server)
// app.use(helmet())

// let server = tls.createServer(credentials, socket => {
//   console.log('server connected',
//               socket.authorized ? 'authorized' : 'unauthorized');
//   socket.write('welcome!\n');
//   socket.setEncoding('utf8');
//   socket.pipe(socket);
// })


// app.get('/', (req, res) => {
//   res.status(200).send('Hello World')
// })

// let httpServer = http.createServer(app)
// // let server = https.createServer(credentials, app)
// socket.init(server)

// let port = process.env.PORT || 3000
// httpServer.listen(port, function () {
//   console.log('http listening on port ', port)
// })
// server.listen(port, function () {
//   console.log('shiiiiiit, listening on port ' + port)
// })


let app = express()
app.set('port', process.env.PORT || 3000)

app.get('/', function (req, res) {
  res.status(200).end('Hello World')
})

socket.init(app)
app.listen(app.get('port'), function () {
  console.log('listening on port', app.get('port'))
})