class RTCPeer {
  constructor (id, name, servers, hooks, level) {
    this.id = id 
    this.name = name 
    this.markedChannels = [] 
    this.channels = [] 
    this.level = level
    this.rtc = new window.RTCPeerConnection(servers)
    this.cr = false 

    this.initRTC(hooks)
  }

  initRTC (hooks) {
    this.rtc.ondatachannel  = event => {
      this.configChannel(event.channel, hooks.datachannel)
      hooks.newdatachannel(event.channel.label, this.id)
    }
    this.rtc.onicecandidate = event => {
      console.log('sending candidate to', this.id)
      hooks.socketSend({ type: 'candidate', to: this.id, candidate: event.candidate })
    } 
    this.rtc.ontrack = null 
  }

  async receiveOffer (offer) {
    await this.rtc.setRemoteDescription(new RTCSessionDescription(offer))
    let answer = await this.rtc.createAnswer() // create answer
    await this.rtc.setLocalDescription(answer)
    return await this.rtc.localDescription // send it via socket (take care of errors)
  }
  async receiveAnswer (answer) {
    await this.rtc.setRemoteDescription(new RTCSessionDescription(answer))
  }
  async receiveCandidate (candidate) {
    if (!this.cr) {
      this.cr = true 
      await this.rtc.addIceCandidate(new RTCIceCandidate(candidate))
    }
  }

  async createOffer () {
    let offer = await this.rtc.createOffer()
    await this.rtc.setLocalDescription(offer)

    return this.rtc.localDescription // send it via socket (take care of errors)
  }
  
  configChannel (channel, hook) {
    this.channels.push(channel)
    this.markedChannels[channel.label] = true 

    if (hook) {
      hook(channel)
      // we want to modify the channel on message function 
      let raw = channel.onmessage // storing the raw function set by user 
      channel.onmessage = message => {
        let data = message.data
        try {
          let data = JSON.parse(data)
        } 
        catch (e) {} // leave it.. its only text
        raw(data, { id: this.id, name: this.name })
      }
    }
  } 
  addDataChannel (name, hook, config = {}) {
    if (this.markedChannels[name] === undefined) {
      let channel = this.rtc.createDataChannel(name, config)
      this.configChannel(channel, hook)
    }
  }


  send (name, data) {
    for (let channel of this.channels) 
      if (channel.label === name) channel.send(data)
  }
}