const express = require('express')
const https = require('https')
const path = require('path')
const fs = require('fs')


let credentials = {
  cert: fs.readFileSync(path.join(__dirname, 'key/cert.pem')),
  key: fs.readFileSync(path.join(__dirname, 'key/private-key.pem')),
}
  
let app = express()
  
// app.use(helmet())

app.get('/Peer', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'Peer.js'))
})
app.get('/RTCPeer', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'RTCPeer.js'))
})
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})
app.listen(3003)
  
let server = https.createServer(credentials, app)

server.listen(3000, function () {
  console.log('listening on port 3000')
})