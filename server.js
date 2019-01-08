const tls  = require('tls'),
      https = require('https'),
      express = require('express'),
      helmet = require('helmet')

const fs   = require('fs')
const path = require('path')

const socket = require('./socket')

let credentials = {
  cert: fs.readFileSync(path.join(__dirname, 'key/cert.pem')),
  key: fs.readFileSync(path.join(__dirname, 'key/private-key.pem')),
}

let app = express()

app.use(helmet())

// let server = tls.createServer(credentials, socket => {
//   console.log('server connected',
//               socket.authorized ? 'authorized' : 'unauthorized');
//   socket.write('welcome!\n');
//   socket.setEncoding('utf8');
//   socket.pipe(socket);
// })


app.get('/', (req, res) => {
  res.status(200).send('Hello World')
})

let server = https.createServer(credentials, app)
socket.init(server)

let port = process.env.PORT || 3000
server.listen(port, function () {
  console.log('shiiiiiit, listening on port ' + port)
})