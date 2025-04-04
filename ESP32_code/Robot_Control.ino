#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// WiFi Credentials
const char* ssid = "Rishi17";
const char* password = "11111111";

// WebSocket Server
const char* websocketServer = "esp32-websocket-server-2.onrender.com";
const int websocketPort = 443; // Default HTTPS port
const char* websocketPath = "/"; // Typically "/ws" or "/" for WebSocket

// Motor Driver Pins
const int enA = 4, in1 = 18, in2 = 19;
const int enB = 5, in3 = 25, in4 = 26;

// Motor Control
const int motorSpeed = 200;
WebSocketsClient webSocket;

void setup() {
  Serial.begin(115200);
  
  // Initialize motor pins
  pinMode(enA, OUTPUT);
  pinMode(enB, OUTPUT);
  pinMode(in1, OUTPUT); 
  pinMode(in2, OUTPUT);
  pinMode(in3, OUTPUT);
  pinMode(in4, OUTPUT);
  stopMotor();
  
  // Connect to WiFi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi");
  Serial.print("IP address: ");
  Serial.println(WiFi.localIP());

  // Configure WebSocket connection
  webSocket.beginSSL(websocketServer, websocketPort, websocketPath);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(5000);
}

void loop() {
  webSocket.loop();
  
  // Send periodic heartbeat if needed
  static unsigned long lastHeartbeat = 0;
  if (millis() - lastHeartbeat > 30000) { // Every 30 seconds
    webSocket.sendTXT("{\"type\":\"heartbeat\",\"device\":\"robot\"}");
    lastHeartbeat = millis();
  }
}

void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch(type) {
    case WStype_DISCONNECTED:
      Serial.println("WebSocket Disconnected!");
      break;
    case WStype_CONNECTED:
      Serial.println("WebSocket Connected!");
      // Send device identification
      webSocket.sendTXT("{\"type\":\"identify\",\"device\":\"robot\"}");
      break;
    case WStype_TEXT: {
      Serial.printf("Received: %s\n", payload);
      
      // Parse JSON message
      DynamicJsonDocument doc(256);
      deserializeJson(doc, payload);
      String command = doc["command"];
      
      // Execute command
      if (command == "forward") moveForward();
      else if (command == "backward") moveBackward();
      else if (command == "left") turnLeft();
      else if (command == "right") turnRight();
      else if (command == "stop") stopMotor();
      break;
    }
    case WStype_ERROR:
    case WStype_FRAGMENT_TEXT_START:
    case WStype_FRAGMENT_BIN_START:
    case WStype_FRAGMENT:
    case WStype_FRAGMENT_FIN:
      break;
  }
}

// Motor control functions
void moveForward() {
  Serial.println("Moving Forward");
  digitalWrite(in1, HIGH); digitalWrite(in2, LOW);
  digitalWrite(in3, HIGH); digitalWrite(in4, LOW);
  analogWrite(enA, motorSpeed);
  analogWrite(enB, motorSpeed);
}

void moveBackward() {
  Serial.println("Moving Backward");
  digitalWrite(in1, LOW); digitalWrite(in2, HIGH);
  digitalWrite(in3, LOW); digitalWrite(in4, HIGH);
  analogWrite(enA, motorSpeed);
  analogWrite(enB, motorSpeed);
}

void turnLeft() {
  Serial.println("Turning Left");
  digitalWrite(in1, LOW); digitalWrite(in2, HIGH);
  digitalWrite(in3, HIGH); digitalWrite(in4, LOW);
  analogWrite(enA, motorSpeed);
  analogWrite(enB, motorSpeed);
}

void turnRight() {
  Serial.println("Turning Right");
  digitalWrite(in1, HIGH); digitalWrite(in2, LOW);
  digitalWrite(in3, LOW); digitalWrite(in4, HIGH);
  analogWrite(enA, motorSpeed);
  analogWrite(enB, motorSpeed);
}

void stopMotor() {
  Serial.println("Stopping");
  digitalWrite(in1, LOW); digitalWrite(in2, LOW);
  digitalWrite(in3, LOW); digitalWrite(in4, LOW);
  analogWrite(enA, 0);
  analogWrite(enB, 0);
}