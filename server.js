const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const fs = require("fs");
const bcrypt = require("bcrypt");

const { handleUpload } = require('./imageHandler');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
let counter = 0;
const activeUsers = [];
// Загрузка изображения
app.post('/upload', handleUpload);

function generateClientId() {
  return Math.random().toString(36).substr(2, 9);
}

const updateOnlineUsers = () => {
  const message = {
    type: "getOnlineUsers",
    online: counter,
  };

  broadcast(message);
};

const broadcast = (message) => {
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

wss.on("connection", (ws, req) => {
  const clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  console.log("Connection from IP:", clientIp);

  ws.clientId = generateClientId();
  counter += 1;
  console.log("Online:", counter, "IP:", clientIp);
  updateOnlineUsers();

  ws.on("message", (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      const { nickname, message: messageText, mentions } = parsedMessage;
      const newUser = { nickname, ws }; // Включаем объект ws
      activeUsers.push(newUser);

      if (mentions && mentions.length > 0) {
        mentions.forEach((mentionedUser) => {
          const targetUser = activeUsers.find(
            (user) => user.nickname === mentionedUser
          );

          if (targetUser) {
            ws.send(
              JSON.stringify({
                  data: messageText,
                  origin: nickname, // Отправитель видит свои приватные сообщения
                  type: "privateMessage",
                  nickname,
              })
          );
            // Отправляем сообщение только целевому пользователю
            targetUser.ws.send(
              JSON.stringify({
                data: messageText,
                origin: ws.clientId,
                type: "privateMessage",
                nickname,
              })
            );
          }
        });
      } else {
        broadcast({
          data: messageText,
          origin: ws.clientId,
          type: "client",
          nickname,
          online: counter,
        });
      }

      console.log(
        "Received message from",
        ws.clientId,
        "with nickname:",
        nickname,
        "and text:",
        messageText
      );
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  });

  ws.on("close", () => {
    counter -= 1;
    console.log("online", counter);

    updateOnlineUsers();

    // Удалить пользователя из списка активных пользователей при закрытии соединения
    const index = activeUsers.findIndex((user) => user.ws === ws);
    if (index !== -1) {
      activeUsers.splice(index, 1);
    }
  });

  ws.send(
    JSON.stringify({
      data: "Hello world",
      origin: "server",
      type: "server",
      clientId: ws.clientId,
    })
  );
});

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://13.53.182.168:3000");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});

app.post("/saveNickname", express.json(), async (req, res) => {
  try {
    const { nickname, password } = req.body;
    if (!nickname || !password) {
      throw new Error("Nickname or password is missing");
    }

    const clientIp =
      req.headers["x-forwarded-for"] || req.connection.remoteAddress;

    console.log("Registration request from IP:", clientIp);

    const filePath = "nicknames.json";
    let fileContent = "";

    if (fs.existsSync(filePath)) {
      fileContent = fs.readFileSync(filePath, "utf-8");
    }

    const users = JSON.parse(fileContent);

    const existingUser = users.find((user) => user.nickname === nickname);

    if (existingUser) {
      const passwordMatch = await bcrypt.compare(
        password,
        existingUser.password
      );

      if (passwordMatch) {
        console.log("Successful login");
        res.status(200).json({
          success: true,
          loginSuccess: true,
          message: "Successful login",
        });
      } else {
        console.log("Invalid password");
        res.status(401).json({
          success: false,
          loginSuccess: false,
          error: "Invalid password",
        });
      }
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      users.push({ nickname, password: hashedPassword });

      fs.writeFileSync(filePath, JSON.stringify(users, null, 2), {
        flag: "w",
      });
      console.log("Successful registration");
      res.status(200).json({
        success: true,
        loginSuccess: false,
        message: "Successful registration",
      });
    }
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

const PORT = 5023;
server.listen(PORT, () => {
  console.log("Server is listening on port:", PORT);
});
