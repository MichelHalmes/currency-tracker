import rp from 'request-promise'
import {client as WebSocketClient} from 'websocket'


class SlackClient {
  constructor() {
    console.log('init')
    this._connectionResolve = undefined
    this._connectionPromise = this._getConnectionPromise()
    this._client = new WebSocketClient()
    this._next_msg_id = 0
    this._messageResolvers = {}
    this._setUpClient()
    this._initialClientConnect()
    // this._sendPingMessages() // Not really useful...
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
      connection.on('message', self._handleConnectionMessage.bind(self))
      connection.on('error', error => { console.log("Connection Error: " + error.toString()) })
      connection.on('close', (code, description) => { console.log('Connection Closed', code, description) })
      self._connectionResolve(connection)
    })
  }

  _handleConnectionMessage(message) {
    let data = JSON.parse(message.utf8Data)
    if (data.type == 'reconnect_url') {
      console.log('Reconnecting')
      this._connectionPromise = this._getConnectionPromise()
      this._client.connect(data.url)
    } else {
      console.log("Received: '" + message.utf8Data + "'")
    }
  }

  _initialClientConnect() {
    let self = this;
    rp(`https://slack.com/api/rtm.connect?token=${process.env.BOT_TOKEN}`, {json: true})
      .then(res => {
        self._client.connect(res.url)
      })
  }

  _sendPingMessages() {
    let self = this
    let message = {id: Math.round(Math.random() * 0xFFFFFF), type: "ping"}
    console.log('Ping')
    self._connectionPromise
      .then(connection => {
        console.log('ping go!')
        connection.sendUTF(JSON.stringify(message))
        setTimeout(self._sendPingMessages.bind(self), 500);
      })

  }

  sendSlackMessage(text) {
    let message = {
        id: 1, type: "message", channel: "D5J58D804", text     
    }
    console.log('Sending')
    this._connectionPromise
      .then(connection => {
        console.log('sending go!')
        connection.sendUTF(JSON.stringify(message))
      })
  }

  close() {
    this._connectionPromise
      .then(connection => {
        console.log('sending close!')
        connection.close()
      })
  }


}


module.exports = SlackClient