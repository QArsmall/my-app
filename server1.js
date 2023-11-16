const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let counter = 0;

function generateClientId() {
  return Math.random().toString(36).substr(2, 9);
}

const updateOnlineUsers = () => {
  const message = {
    type: 'getOnlineUsers',
    online: counter
  };

  broadcast(message);
};
const broadcast = (message) => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

wss.on('connection', ws => {
  ws.clientId = generateClientId();
  counter += 1;
  console.log('online', counter);

  updateOnlineUsers();
  ws.on('message', message => {
    try {
      const parsedMessage = JSON.parse(message);

      const { nickname, message: messageText } = parsedMessage;

      broadcast({
        data: messageText,
        origin: ws.clientId,
        type: 'client',
        nickname: nickname,
        online: counter
      });

      console.log('Received message from', ws.clientId, 'with nickname:', nickname, 'and text:', messageText);
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }
  });

  ws.on('close', () => {
    counter -= 1;
    console.log('online', counter);

    updateOnlineUsers();
  });

  ws.send(JSON.stringify({ data: 'hello world', origin: 'server', type: 'server', clientId: ws.clientId }));
});

// const PORT = 3023;
const PORT = 5001;
server.listen(PORT, () => {
  console.log('Server is listening on port:', PORT);
});