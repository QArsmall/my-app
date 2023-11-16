const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');

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

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});
app.post('/saveNickname', express.json(), (req, res) => {
  try {
    const { nickname, password } = req.body;
    if (!nickname || !password) {
      throw new Error('Nickname or password is missing');
    }

    const filePath = 'nicknames.txt';
    let fileContent = '';

    if (fs.existsSync(filePath)) {
      fileContent = fs.readFileSync(filePath, 'utf-8');
    }

    const existingUser = fileContent
      .split('\n')
      .map(line => line.split(' = ')[0].trim()) // Получаем все имена из файла
      .find(existingNickname => existingNickname === nickname);

    if (existingUser) {
      console.log('Successful login'); // Уже существует пользователь с таким именем
      res.status(200).json({ success: true, loginSuccess: true, message: 'Successful login' });
    } else {
      // Записываем нового пользователя в файл
      fs.writeFileSync(filePath, `${nickname} = ${password}\n`, { flag: 'a' });
      console.log('Successful registration');
      res.status(200).json({ success: true, loginSuccess: false, message: 'Successful registration' });
    }
  } catch (error) {
    console.error('Error handling request:', error);
    res.status(500).json({ success: false, error: 'Internal Server Error' });
  }
});



const PORT = 5001;
server.listen(PORT, () => {
  console.log('Server is listening on port:', PORT);
});