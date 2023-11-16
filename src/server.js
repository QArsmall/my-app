const net = require('net');  // Подключение модуля "net" для работы с сетевыми сокетами.

const server = net.createServer((socket) => {  // Создание сервера и обработчика подключений.
  console.log('Connected by IP', socket.remoteAddress, 'PORT', socket.remotePort);  // Вывод информации о подключении клиента.

  socket.on('data', (data) => {  // Обработка данных, полученных от клиента.
    console.log('Received data from client:', data.toString());  // Вывод полученных данных от клиента.
    const kissedData = data.toString().toUpperCase();  // Обработка данных: разворачивание в обратном порядке.
    socket.write(kissedData);  // Отправка обработанных данных обратно клиенту.
  });

  socket.on('end', () => {  // Обработка завершения соединения с клиентом.
    console.log('Client disconnected');  // Вывод сообщения о разрыве соединения с клиентом.
  });

  socket.on('error', (err) => {  // Обработка ошибок, возникающих при взаимодействии с клиентом.
    console.error('Error:', err);  // Вывод сообщения об ошибке.
  });
});

const PORT = 5001;  // Порт, на котором сервер будет слушать входящие соединения.

server.listen(PORT, () => {  // Запуск сервера на указанном порту и IP-адресе.
  console.log(`Server listening on :${PORT}`);  // Вывод сообщения о запуске сервера и слушании указанного адреса и порта.
});
