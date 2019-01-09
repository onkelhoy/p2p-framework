class Peer {
  constructor (signalingServer, options = {}) {
    this.socket = new window.WebSocket(signalingServer) 
    this.peers = [] 
    this.room = null 
    this.id = null
    this.level = 0
    this.name_value = options.name || 'Sir Noname'
    this.hooks = { 
      socketSend: this.socketSend.bind(this),
      newdatachannel: this.newdatachannel.bind(this),
      datachannel: c => console.log('You have no handle function for datachannel', c)
    }
    this.dbNames = options.dataChannels || []
    this.offerOptions = {}
    this.localStream = null 
    this.host = false 

    this.servers = options.servers || {
      iceServers: [{urls: "stun:stun.l.google.com:19302"}]
    }
    this.onSocketMessage = this.onSocketMessage.bind(this)
    this.socket.onmessage = this.onSocketMessage
  }

  set name (value) {
    this.name_value = value 
    this.socketSend({ type: 'name change', name: value })
  }
  get name () {
    return this.name_value
  }

  on (hook, cb) {
    this.hooks[hook.toLowerCase()] = cb
  }
  onSocketMessage (message) {
    let data = JSON.parse(message.data)
    switch (data.type) {
      case 'connected':
        this.id = data.id 
        break;
      case 'room disconnect':
        this.room = null 
        // remove all rtc clients 
        this.peers = []
        break;
      case 'disconnect':
        console.log('player disconnected', data.from)
        for (let i = 0; i < this.peers.length; i++)
          if (this.peers[i].id === data.from) 
            return this.peers.splice(i, 1)
        break;
      case 'new client':
        console.log('new client connected')
        this.connectWith(data.id, data.name, data.level)
        break;
      case 'message':
        console.log(data.message, this.hooks.message)
        if (this.hooks.message) this.hooks.message(data.message)
        break;
      case 'room connect':
        this.peers = []
        this.room = data.room
        this.host = data.host
        this.level = data.level
        if (this.hooks.connect) this.hooks.connect(data.host)
        break;
      case 'offer':
        console.log('offer received, mine:', data.to === this.id)
        if (data.to === this.id)
          this.receiveOffer(data)
        break;
      case 'answer':
        console.log('answer received, mine:', data.to === this.id)
        if (data.to === this.id)
          this.receiveAnswer(data)
        break;
      case 'candidate':
        console.log('candidate received, mine:', data.to === this.id)
        if (data.to === this.id)
          this.receiveCandidate(data)
        break;
      case 'host':
        this.host = true 
        break;
      case 'name change':
        for (let peer of this.peers) 
          if (data.from === peer.id) peer.name = data.name
        break;
      case 'error':
        if (this.hooks.error) this.hooks.error(data.error)
        break;
    } 

    // if user hooks own onmessage events 
  }
  socketSend (data) {
    this.socket.send(JSON.stringify(data))
  } 
  async newdatachannel (label, from_id) {
    // add same channel to rest of peers (but only if their rank is higher)
    let exists = false 
    for (let { name } of this.dbNames) {
      if (name === label) exists = true  
    }
    if (!exists) this.dbNames.push({ name: label, config: {} }) 

    for (let peer of this.peers) {
      if (from_id !== peer.id && peer.level > this.level) {
        if (!peer.markedChannels[label]) { // .find(label => label === event.channel.label)) {
          peer.addDataChannel(label, this.hooks.datachannel, {})

          try {
            let offer = await peer.createOffer()
            this.socketSend({ type: 'offer', to: peer.id, offer, name: this.name })
          } catch (e) {
            this.hooks.error(e)
          }
        }
      }
    }
  }
  
  //* happens : when someone connects to room (new)
  //* as this client connects to other, this is then HOST
  async connectWith (id, name, level) {
    let peer = new RTCPeer(id, name, this.servers, this.hooks, level)
    this.peers.push(peer)

    // only make offer 
    for (let {name, config} of this.dbNames) 
      peer.addDataChannel(name, this.hooks.datachannel, config)
    
    try {
      let offer = await peer.createOffer()
      this.socketSend({ type: 'offer', to: peer.id, offer, name: this.name, level: this.level })
    } catch (e) {
      this.hooks.error(e)
    }
  } 
  async receiveOffer (data) { // has offer and from who (id)
    // let connection = this.createPeer(data.from, data.name)
    // create peer if not created 
    let peer = undefined
    for (let peer2 of this.peers) 
      if (peer2.id === data.from) peer = peer2 
    
    // only created if not exist
    if (!peer) {
      console.log('creating new peer since he does not exists yet')
      peer = new RTCPeer(data.from, data.name, this.servers, this.hooks, data.level)
      this.peers.push(peer)
    }
    
    try {
      console.log('creating and sending answer')
      let answer = await peer.receiveOffer(data.offer)
      this.socketSend({ type: 'answer', to: data.from, answer })
    }
    catch (e) {
      this.hooks.error(e)
    }
  }
  receiveAnswer (data) {
    for (let peer of this.peers) {
      if (peer.id === data.from) {
        try {
          console.log('adding answer to peer', peer)
          peer.receiveAnswer(data.answer)
        }
        catch (e) {
          this.hooks.error(e)
        }
      }
    }
  } 
  receiveCandidate (data) {
    for (let peer of this.peers) {
      if (peer.id === data.from) {
        try {
          console.log('adding candidate to', peer)
          peer.receiveCandidate(data.candidate)
        } catch (e) {
          this.hooks.error(e)
        }
      }
    }
  }

  //* Manual functions to be made from user
  create (roomName, options = { password: undefined, max: 10 }) {
    this.socketSend({ type: 'create', room: roomName, password: options.password, max: options.max })
  }
  join (roomID, password) {
    this.socketSend({ type: 'join', room: roomID, password, name: this.name })
  }
  addDataChannel (name, config = {}) {
    for (let peer of this.peers) 
      peer.addDataChannel(name, this.hooks.datachannel, config)
    
    // try creating a new offer! 
    this.dbNames.push({name, config})
  }
  async addStream (option = {video:true, audio:true}) {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true })
      console.log('received stream')
      this.offerOptions = {
        offerToReceiveAudio: options.audio,
        offerToReceiveVideo: options.video,
      }
      this.localStream = stream
    }
    catch (e) {
      console.error('get user media error: ' + e.name)
      if (this.hooks.error) this.hooks.error(e)
    }
  }
  send (name, data) {
    if (data instanceof Object)
      data = JSON.stringify(data)

    for (let peer of this.peers) 
      peer.send(name, data)
  }
}