#!/usr/bin/env node
const unirest = require('unirest');
var WebSocketClient = require('websocket').client;
var client = new WebSocketClient();
 
client.on('connectFailed', function(error) {
    console.log('Connect Error: ' + error.toString());
});
 
client.on('connect', function(connection) {
  console.log('WebSocket Client Connected');
  connection.on('error', function(error) {
      console.log("Connection Error: " + error.toString());
  });
  connection.on('close', function(reasonCode, description) {
      console.log('Connection Closed', reasonCode, description);
  });
  connection.on('message', function(message) {
    
    data = JSON.parse(message.utf8Data)
    if (data.type == 'reconnect_url') {
      console.log('Reconnectiong')
      client.connect(data.url)
    } else {
      console.log("Received: '" + message.utf8Data + "'");
    }
  });
  
  function sendNumber() {
    if (connection.connected) {
      let message = {
        "id": 1,
        "type": "message",
        "channel": "D5J58D804",
        "text": "Hello world"
      }
      console.log('Sending')
      connection.sendUTF(JSON.stringify(message));
      setTimeout(sendNumber, 1000);
    }
  }
  sendNumber();
});

const bot_token = process.env.BOT_TOKEN
const connect_url = `https://slack.com/api/rtm.connect?token=${bot_token}`
unirest.get(connect_url)
  .send()
  .end(response => {
  if (response.ok) {
    console.log("Got a response: ", response.body)
    const ws_url = response.body.url
    client.connect(ws_url);
  } else {
    console.log("Got an error: ", response.error)
  }
  })


// client.connect(connect_url, 'echo-protocol');


// 'C5JT78347',
// name: 'general',

// 'C5HFQBQ2V',
// name: 'random',

// id: 'D5J58D804',
// Michel