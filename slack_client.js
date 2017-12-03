import rp from 'request-promise'
import {client as WebSocketClient} from 'websocket'


class SlackClient {
  constructor() {
    this._closing = false
    this._closed = false
    this._connectionResolve = undefined
    this._connectionPromise = this._getConnectionPromise()
    this._client = new WebSocketClient()
    this._msg_id = 0
    this._messageResolvers = {}
    this._setUpClient()
    this._initialClientConnect()
    //this._sendPingMessages() // Not really useful...
  }

  _getConnectionPromise() {
    return new Promise((resolve, reject) => {
      this._connectionResolve = resolve
    })
  }

  _setUpClient() {
    let self = this;
    self._client.on('connectFailed', error => { console.log('Connect Error: ' + error.toString()) })
    self._client.on('connect', connection => {
      console.log('WebSocket Client Connected')
      connection.on('message', self._handleConnectionMessage.bind(self, connection))
      connection.on('error', error => { console.log("Connection Error: " + error.toString()) })
      connection.on('close', (code, description) => { console.log('Connection Closed:', description) })
      self._connectionResolve(connection)
    })
  }

  _handleConnectionMessage(conn, message) {
    let data = JSON.parse(message.utf8Data)
    switch(data.type) {
      case 'reconnect_url':
        if (!this._closed) {
          console.log('Reconnecting...')
          this._connectionPromise = this._getConnectionPromise()
          conn.close()
          this._client.connect(data.url)
        }
        break
      case 'message':
        if (data.reply_to) {
          this._resolveMessage(data.reply_to)
        }
        break
      case 'pong':
        this._resolveMessage(data.reply_to)
        break
      case 'hello':
      case 'presence_change':
        break // Do nothing
      default:
        console.log("Received: '" + message.utf8Data + "'")
    }
  }

  _initialClientConnect() {
    let self = this;
    rp(`https://slack.com/api/rtm.connect?token=${process.env.BOT_TOKEN}`, {json: true})
      .then(res => {
        if (!res.ok) {
          throw Error("Could not connect: " + res.error) 
        }
        self._client.connect(res.url)
      })
  }

  _sendMessage(message) {
    if (this._closing) {
      return Promise.resolve(false)
    }

    message.id = this._msg_id++
    let promise = new Promise((resolve, reject) => {
      this._messageResolvers[message.id] = {resolve}
    })
    this._messageResolvers[message.id].promise = promise
    setTimeout(this._resolveMessage.bind(this, message.id, false), 5000) 
    console.log('Sending', message)
    return this._connectionPromise
      .then(connection => {
        console.log('\tConnection for:', message.id)
        connection.sendUTF(JSON.stringify(message))
        return promise
      })
      .then(ok => {
        console.log('\tResolved:', message.id, ok)
        return ok
      })
  }

  _resolveMessage(id, ok=true) {
    if (this._messageResolvers[id]){
      this._messageResolvers[id].resolve(ok)
    }
  }

  _sendPingMessages() {
    let message = {type: "ping"}
    this._sendMessage(message)
    setTimeout(this._sendPingMessages.bind(this), 5000)
  }

  sendSlackMessage(text) {
    let message = {type: "message", channel: "D5J58D804", text}
    this._sendMessage(message)
  }

  close() {
    this._closing = true
    console.log('Closing! Waiting for promises...')
    let promises = Object.keys(this._messageResolvers).map(k => 
      this._messageResolvers[k].promise
    )
    Promise.all(promises)
      .then(blah => {
        console.log('All messages resolved!')
        return this._connectionPromise
      })
      .then(connection => {
        console.log('Final close!')
        connection.close()
        this._closed = true
        
      })
  }


}


module.exports = SlackClient