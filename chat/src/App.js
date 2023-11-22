import React, { useRef, useState, useEffect } from "react";
import ReactDOM from "react-dom";
import "./App.css";
import ReconnectingWebSocket from "reconnecting-websocket";
import axios from "axios";

let counter = 0;
let ws;
let clientId; // объявление переменной clientId за пределами функции компонента
let clientNick = "anonymous";

function App() {
  if (!counter) {
    ws = new WebSocket("ws://13.53.182.168:5023");
  }
  counter += 1;
  const statusRef = useRef(null);
  const messagesRef = useRef(null);
  const inpuNickRef = useRef(null);
  const inputRef = useRef(null);
  const onlineRef = useRef(null);
  const inputPasswordRef = useRef(null);
  const [status, setStatus] = useState("");
  const [onlineUsers, setOnlineUsers] = useState(0);
  const [registrationStatus, setRegistrationStatus] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const enterButtonRef = useRef(null);
  const [isChatFormVisible, setIsChatFormVisible] = useState(false);
  const [messageInputs, setMessageInputs] = useState({});
  const passwordRef = useRef(null);
  const [isChatFlashing, setIsChatFlashing] = useState(false);

  const toggleChatForm = () => {
    setIsChatFormVisible(!isChatFormVisible);
  };

  const handleSaveNickname = async () => {
    const nickname = inpuNickRef.current.value.trim();
    const password = inputPasswordRef.current.value.trim();

    if (nickname && password !== "") {
      try {
        const response = await axios.post(
          "http://13.53.182.168:5023/saveNickname",
          { nickname, password }
        );
        if (response.data.success) {
          if (response.data.loginSuccess) {
            setRegistrationStatus("Successful login!");
            setIsLoggedIn(true);
            hiddenLoginMenu();
          } else {
            setRegistrationStatus("Successful registration!");
            hiddenLoginMenu();
          }
        } else {
          setRegistrationStatus(
            `Ошибка при регистрации или входе: ${response.data.error}`
          );
        }
      } catch (error) {
        setRegistrationStatus(
          `Ошибка при регистрации или входе: ${error.message}`
        );
      }
    } else {
      setRegistrationStatus("Nickname and password cannot be blank");
    }
  };
  const hiddenLoginMenu = () => {
    if (inputPasswordRef.current) {
      inputPasswordRef.current.style.display = "none";
    }
    if (enterButtonRef.current) {
      enterButtonRef.current.style.display = "none";
      passwordRef.current.style.display = "none";
    }
    if (inpuNickRef.current) {
      inpuNickRef.current.disabled = true;
    }
  };
  const printMessage = (value, className, nickname) => {
    
    if (messagesRef.current && value && typeof value === "string") {
      const blockMessageDiv = document.createElement("div");
      blockMessageDiv.classList.add("block-message");

      const nickDiv = document.createElement("div");
      nickDiv.textContent = nickname + ":";

      if (nickname === undefined) {
        nickDiv.textContent = "";
      }

      nickDiv.classList.add("nick");
      blockMessageDiv.appendChild(nickDiv);

      const messageDiv = document.createElement("div");
      messageDiv.className = "message";
      blockMessageDiv.className = className;
      const timeDiv = document.createElement("div");
      timeDiv.className = "message-time";
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
        behavior: "smooth",
      });
    }
    setIsChatFlashing(true);
    setTimeout(() => {
      // Удалим класс flash через 1.5 секунды (длительность анимации + запас)
      setIsChatFlashing(false);
    }, 1500);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const inputValue = inputRef.current.value.trim();
    const inputNickValue = inpuNickRef.current.value.trim();
    const inputPasswordValue = inputPasswordRef.current.value.trim();

    if (inputValue && inputNickValue && inputPasswordValue) {
      const messageData = {
        message: inputValue,
        nickname: inputNickValue,
        password: inputPasswordValue,
      };

      const mentionedUsers = findMentionedUsers(inputValue);
      if (mentionedUsers.length > 0) {
        messageData.mentions = mentionedUsers;
      }

      ws.send(JSON.stringify(messageData));

      setMessageInputs((prevInputs) => ({
        ...prevInputs,
        [clientId]: "", // Очищаем поле ввода только для текущего клиента
      }));
      console.log("clientID", clientId);
    } else {
      setRegistrationStatus(
        "Cannot send message if nickname or password is empty"
      );
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSubmit(event);
    }
  };
  const findMentionedUsers = (message) => {
    const mentionedUsers = [];
    const words = message.split(" ");

    for (const word of words) {
      if (word.startsWith("@")) {
        // Извлечение ника из упоминания и добавление в массив
        const mentionedUser = word.slice(1);
        mentionedUsers.push(mentionedUser);
        console.log("mentionedUsers", mentionedUsers);
      }
    }

    return mentionedUsers;
  };
  useEffect(() => {
    const handleOpen = () => {
      setStatus("online...");
      getOnlineUsers();
      statusRef.current.className = "status";
    };

    const handleClose = () => {
      setStatus("disconnected...");
      statusRef.current.className = "disconnected-style";
      setOnlineUsers("∞");
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
        const messageType = parsedResponse.type || "";
        const clientIdServer = parsedResponse.origin;
        if (messageType === "server") {
          printMessage(
            parsedResponse.data,
            "block-message-server",
            clientIdServer
          );
        } else if (messageType === "client" && clientIdServer === clientId) {
          printMessage(
            parsedResponse.data,
            "block-message",
            inpuNickRef.current.value
          );
        } else if (messageType === "client" && clientIdServer !== clientId) {
          printMessage(
            parsedResponse.data,
            "block-message-other",
            parsedResponse.nickname
          );
        } else if (messageType === "privateMessage") {
          // Обработка приватных сообщений от сервера
          printMessage(
            parsedResponse.data,
            "block-message-private",
            parsedResponse.nickname
          );
        }
        if (parsedResponse.type === "getOnlineUsers") {
          setOnlineUsers(parsedResponse.online);
        }
      } catch (error) {
        console.error("Ошибка при разборе JSON:", error);
      }
    };

    ws.onopen = handleOpen;
    ws.onclose = handleClose;
    ws.onmessage = (response) => {
      handleMessage(response);
      handleOnline(response);
    };

    return () => {
      ws.onopen = null;
      ws.onclose = null;
      ws.onmessage = null;
    };
  }, []);
  const getOnlineUsers = () => {
    ws.send(JSON.stringify({ type: "getOnlineUsers" }));
  };

  return (
    <header className="App-header">
      <div className="nickName">
        <div>Your nickname:</div>
        <input
          id="inputNick"
          ref={inpuNickRef}
          onKeyDown={handleKeyDown}
          placeholder="nickname"
        />
        <div ref={passwordRef}>Your password:</div>
        <input
          id="inputNick"
          type="password"
          ref={inputPasswordRef}
          onKeyDown={handleKeyDown}
          placeholder="password"
        />

        <button
          className="btn-nick"
          type="submit"
          ref={enterButtonRef}
          onClick={handleSaveNickname}
        >
          Enter
        </button>
        <div className="registration-status">{registrationStatus}</div>
      </div>
      <div className="status" id="status" ref={statusRef}>
        {status}
        <div className="online" ref={onlineRef}>
          {onlineUsers}
        </div>
      </div>
      <div className={`chat-window ${isChatFlashing ? 'flash' : ''}`}>
        <div id="messages" ref={messagesRef}></div>

        <form onSubmit={handleSubmit} className="form-message">
          <input
            id="input"
            ref={inputRef}
            value={messageInputs[clientId] || ""}
            onChange={(e) =>
              setMessageInputs((prevInputs) => ({
                ...prevInputs,
                [clientId]: e.target.value,
              }))
            }
            onKeyDown={handleKeyDown}
          />
          <button className="btn-send" type="submit">
            Send
          </button>
        </form>
      </div>
    </header>
  );
}

export default App;
