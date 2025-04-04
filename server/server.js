const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;

// Store connected clients
const clients = new Set();

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New client connected');
  clients.add(ws);

  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
    
    try {
      const data = JSON.parse(message);
      
      // Handle device identification
      if (data.type === 'identify') {
        ws.deviceType = data.device;
        return;
      }
      
      // Broadcast commands to all robots
      if (data.command) {
        clients.forEach(client => {
          if (client.deviceType === 'robot' && client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ 
              command: data.command,
              timestamp: Date.now()
            }));
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
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve static files
app.use(express.static('public'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    clients: clients.size
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});