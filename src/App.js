import React, { useRef, useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import './App.css';
import ReconnectingWebSocket from 'reconnecting-websocket';
import axios from 'axios';



let counter = 0
let ws;
let clientId; // объявление переменной clientId за пределами функции компонента
let clientNick = 'anonymous';

function App() {
  if (!counter) { ws = new WebSocket('ws://192.168.1.118:5001');

};
// if (!counter) { ws = new WebSocket('ws://localhost:3023');
//  };
  counter += 1
  const statusRef = useRef(null);
  const messagesRef = useRef(null);
  const inpuNickRef = useRef(null)
  const inputRef = useRef(null);
  const onlineRef = useRef(null)
  const inputPasswordRef = useRef(null)
  const [status, setStatus] = useState('');
  const [onlineUsers, setOnlineUsers] = useState(0);


  const handleSaveNickname = async () => {
    const nickname = inpuNickRef.current.value.trim();
    const password = inputPasswordRef.current.value.trim();

    if (nickname && password !== '') {
      try {
        const response = await axios.post('http://localhost:5001/saveNickname', { nickname, password });
        if (response.data.success) {
          console.log('Nickname and password saved successfully');
        } else {
          console.error('Failed to save nickname:', response.data.error);
        }
      } catch (error) {
        console.error('Error while saving nickname:', error);
      }
    } else {
      console.error('Nickname cannot be empty');
    }
  };

  const printMessage = (value, className, nickname) => {
    if (messagesRef.current && value && typeof value === 'string') {
      const blockMessageDiv = document.createElement('div');
      blockMessageDiv.classList.add('block-message');

      const nickDiv = document.createElement('div');
      nickDiv.textContent = nickname + ':';

      if (nickname === undefined) {
        nickDiv.textContent = '';
      }

      nickDiv.classList.add('nick');
      blockMessageDiv.appendChild(nickDiv);

      const messageDiv = document.createElement('div');
      messageDiv.className = 'message'
      blockMessageDiv.className = className
      const timeDiv = document.createElement('div');
      timeDiv.className = 'message-time';
      const currentTime = new Date();
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const seconds = currentTime.getSeconds();
      timeDiv.textContent = `${hours}:${minutes}:${seconds}`;

      messageDiv.textContent = value;
      messageDiv.appendChild(timeDiv);

      blockMessageDiv.appendChild(messageDiv);

      messagesRef.current.appendChild(blockMessageDiv);
      messagesRef.current.scrollTo({
        top: messagesRef.current.scrollHeight,
        behavior: 'smooth',
      });
      inputRef.current.value = '';
    }
  };


  const handleSubmit = (event) => {
    event.preventDefault();
    const inputValue = inputRef.current.value.trim();
    const inputNickValue = inpuNickRef.current.value.trim();
    if (inputValue && inputNickValue !== '') {
      const messageData = {
        message: inputValue,
        nickname: inputNickValue,
      };

      ws.send(JSON.stringify(messageData));

      inputRef.current.value = '';
    }
  };


  const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
      handleSubmit(event);
    }
  };

  useEffect(() => {

    const handleOpen = () => {
      setStatus('online...');
      getOnlineUsers();
      statusRef.current.className = 'status';

    };

    const handleClose = () => {
      setStatus('disconnected...');
      statusRef.current.className = 'disconnected-style';
      setOnlineUsers('∞')
    };
    const handleOnline = (response) => {
      const parsedResponse = JSON.parse(response.data);
      setOnlineUsers(parsedResponse.online);
    };
    const handleMessage = (response) => {
      const parsedResponse = JSON.parse(response.data);

      if (!clientId) {
        clientId = parsedResponse.clientId;
      }
      try {
        const messageType = parsedResponse.type || '';
        const clientIdServer = parsedResponse.origin;
        if (messageType === 'server') {
          printMessage(parsedResponse.data, 'block-message-server', clientIdServer);
        } else if (messageType === 'client' && clientIdServer === clientId) {
          printMessage(parsedResponse.data, 'block-message', inpuNickRef.current.value);
        } else if (messageType === 'client' && clientIdServer !== clientId) {
          printMessage(parsedResponse.data, 'block-message-other', parsedResponse.nickname);
        }
        if (parsedResponse.type === 'getOnlineUsers') {
          setOnlineUsers(parsedResponse.online);
        }
      } catch (error) {
        console.error('Ошибка при разборе JSON:', error);
      }
    };

    ws.onopen = handleOpen;
    ws.onclose = handleClose;
    ws.onmessage = (response) => {
      handleMessage(response);
      handleOnline(response)
    };

    // Очистка обработчиков при размонтировании компонента
    return () => {
      ws.onopen = null;
      ws.onclose = null;
      ws.onmessage = null;
    };
  }, []);
  const getOnlineUsers = () => {
    ws.send(JSON.stringify({ type: 'getOnlineUsers' }));
  };

  return (
    <header className='App-header'>

      <div className='nickName'>
        <div>nickname:</div>
        <input autocomplete="off" id="inputNick" ref={inpuNickRef} onKeyDown={handleKeyDown} />
        <div>password:</div>
        <input autocomplete="off" id="inputNick" ref={inputPasswordRef} onKeyDown={handleKeyDown} />

        <button className='btn-nick' type='submit' onClick={handleSaveNickname}>
          save
        </button>
      </div>
      <div className='status' id="status" ref={statusRef}>
        {status}
        <div className='online' ref={onlineRef}>
        {onlineUsers}
        </div>
      </div>
      <div className='chat-window'>
        <div id="messages" ref={messagesRef}>
        </div>

        <form onSubmit={handleSubmit} className='form-message'>
          <input autocomplete="off" id="input" ref={inputRef} onKeyDown={handleKeyDown} />
          <button className='btn-send' type='submit'>
            Send
          </button>
        </form>
      </div>
    </header>
  );
}

export default App;
