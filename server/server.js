const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3000;
const publicPath = path.join(__dirname, 'public');

// Ensure public directory exists
const fs = require('fs');
if (!fs.existsSync(publicPath)) {
  fs.mkdirSync(publicPath, { recursive: true });
  console.log('Created public directory');
}

// WebSocket and routes would remain the same as before
// ... [rest of your existing websocket code]

// Serve static files
app.use(express.static(publicPath));

// Root route
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving from: ${publicPath}`);
});