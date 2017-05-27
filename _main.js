import SlackClient from './slack_client';


let slack = new SlackClient()


function sendNumber() {
  slack.sendSlackMessage('aweee')
  setTimeout(sendNumber, 1000);

}
sendNumber();