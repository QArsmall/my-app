# Chat App

This is a simple chat application built with React and WebSocket.

## Features

- Real-time messaging with WebSocket
- Registration and login functionality
- Display online users
- Timestamps for messages

## Getting Started

### Prerequisites

- Node.js installed
- WebSocket server running (e.g., [WebSocket server](https://github.com/websockets/ws) or your own server implementation)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/chat-app.git
2. Change into the project directory:

cd chat-app

3. Install dependencies:

npm install

4. Update the WebSocket server URL:

Open src/App.js and find the WebSocket instantiation. Update the URL with the appropriate WebSocket server URL:
let ws = new WebSocket('ws://your-websocket-server-url');

5. Start the application:

npm start

Open your browser and visit http://localhost:3000.

Enter a nickname, password, and start chatting!