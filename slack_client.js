
import unirest from 'unirest';
import rp from 'request-promise';
import {client as WebSocketClient} from 'websocket' ;


class SlackClient {
  constructor() {
    this.connection
    this.client = new WebSocketClient()
    this.setUpClient()
    this.initialClientConnect()

    
  }

  setUpClient() {
    let self = this;
    self.client.on('connect', connection => {
      console.log('WebSocket Client Connected')
      connection.on('message', self.handleConnectionMessage.bind(self))
      connection.on('error', error => { console.log("Connection Error: " + error.toString()) })
      connection.on('close', (code, description) => { console.log('Connection Closed', code, description) }) 
    })
    self.client.on('connectFailed', error => { console.log('Connect Error: ' + error.toString()) })
  }
  
  handleConnectionMessage(message) {

    let data = JSON.parse(message.utf8Data)
    if (data.type == 'reconnect_url') {
      console.log('Reconnecting')
      this.client.connect(data.url)
    } else {
      console.log("Received: '" + message.utf8Data + "'");
    }

  }

  initialClientConnect() {
    let self = this;
    rp(`https://slack.com/api/rtm.connect?token=${process.env.BOT_TOKEN}`, {json: true})
      .then(res => {
        self.client.connect(res.url)
      })
  }


}


module.exports = SlackClient