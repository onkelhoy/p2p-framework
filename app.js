const express = require('express')
const path = require('path')
  
let app = express()
app.use(helmet())

app.get('/Peer', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'Peer.js'))
})
app.get('/RTCPeer', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'RTCPeer.js'))
})
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'))
})

let port = process.env.PORT || 3000
app.listen(port, function () {
  console.log('up and running on port', port)
})