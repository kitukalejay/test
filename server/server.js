// server.js
const express = require('express');
const WebSocket = require('ws');
const http = require('http');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    
    try {
      const data = JSON.parse(message);
      
      // Handle identification
      if (data.type === 'identify') {
        ws.deviceType = data.device;
        return;
      }
      
      // Broadcast commands to all robots (or specific ones)
      if (data.command) {
        clients.forEach(client => {
          if (client.deviceType === 'robot' && client !== ws) {
            client.send(JSON.stringify({ command: data.command }));
          }
        });
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    clients.delete(ws);
  });
});

// Web control interface
app.get('/', (req, res) => {
  res.send(`
  <!DOCTYPE html>
  <html>
  <head>
    <title>Robot WebSocket Control</title>
    <style>
      body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
      button { padding: 15px 25px; font-size: 18px; margin: 10px; cursor: pointer; }
    </style>
  </head>
  <body>
    <h1>Robot Control Panel</h1>
    <button onclick="sendCommand('forward')">Forward</button><br>
    <button onclick="sendCommand('left')">Left</button>
    <button onclick="sendCommand('stop')">Stop</button>
    <button onclick="sendCommand('right')">Right</button><br>
    <button onclick="sendCommand('backward')">Backward</button>
    
    <script>
      const ws = new WebSocket('wss://${process.env.RENDER_EXTERNAL_HOSTNAME || 'localhost'}:${process.env.PORT || 3000}');
      
      function sendCommand(command) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ command }));
        } else {
          alert('WebSocket not connected');
        }
      }
      
      ws.onopen = () => console.log('Connected to server');
      ws.onerror = (error) => console.error('WebSocket error:', error);
    </script>
  </body>
  </html>
  `);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});