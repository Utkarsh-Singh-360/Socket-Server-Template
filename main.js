const http = require("http");
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());
// require("dotenv").config();
require('dotenv').config()

const serverPort = process.env.PORT || 3000;
const server = http.createServer(app);
const WebSocket = require("ws");
const { writeJsonToFile, fileExistsSync, deleteFile } = require("./utility/createFile");
const { readFileSyncFn } = require("./wav");
const { uploadFile } = require("./utility/uploadsAWS");

let keepAliveId;

const wss =
  process.env.NODE_ENV === "production"
    ? new WebSocket.Server({ server })
    : new WebSocket.Server({ port: 5001 });

server.listen(serverPort);
console.log(
  `Server started on port ${serverPort} in stage ${process.env.NODE_ENV}`
);
console.log(path.join(__dirname));

wss.on("connection", function (ws, req) {
  console.log("Connection Opened");
  console.log("Client size: ", wss.clients.size);

  if (wss.clients.size === 1) {
    console.log("first connection. starting keepalive");
    keepServerAlive();
  }

  ws.on("message", (data) => {
    console.log(data);
    let stringifiedData = data.toString();
    if (stringifiedData === "pong") {
      console.log("keepAlive");
      return;
    }
    broadcast(ws, stringifiedData, false);
  });

  ws.on("close", (data) => {
    console.log("closing connection");

    if (wss.clients.size === 0) {
      console.log("last client disconnected, stopping keepAlive interval");
      clearInterval(keepAliveId);
    }
  });
});

// Implement broadcast function because of ws doesn't have it
const broadcast = (ws, message, includeSelf) => {
  if (includeSelf) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  } else {
    wss.clients.forEach((client) => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
};

/**
 * Sends a ping message to all connected clients every 50 seconds
 */
const keepServerAlive = () => {
  keepAliveId = setInterval(() => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send("ping");
      }
    });
  }, 50000);
};

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.post("/t1", (req, res) => {
  const {event,sequenceNumber,streamSid} =req?.body;
  if (event === "start" && sequenceNumber === '1') {
    writeJsonToFile(`${streamSid}.json`, req.body, (err) => {
      if (err) {
        console.error("Failed to write JSON file:", err);
        res.status(400).send({message:"Failed to write JSON file"});
        return
      } else {
        console.log("JSON file created successfully!");
        res.send("JSON file created successfully!");
      }
    });
  } else {
    fs.readFile(path.join(__dirname, `${streamSid}.json`),"utf8", async (readErr, data) => {
        if (readErr) {
          res.status(400).send({message:"Error reading file"});
          return;
        }
        // Parse the existing data and append the new data
        let existingData = [JSON.parse(data)];
        existingData.unshift(req?.body);
        if(event === 'stop'){
          await readFileSyncFn(streamSid)
          await uploadFile(path.join(__dirname, `${streamSid}.wav`));
          deleteFile(path.join(__dirname, `${streamSid}.json`));
          deleteFile(path.join(__dirname, `${streamSid}.wav`));
          res.send({message:"stream stop successfully!"});
          return;
        }
        // Write the updated data back to the file
        fs.writeFile( path.join(__dirname, `${streamSid}.json`),JSON.stringify(existingData, null, 2), { flag: "w" },(writeErr) => {
            if (writeErr) {
              console.error("Error writing file:", writeErr);
              res.status(400).send({message:"Error writing file"});
              return;
            }
            console.log("Data appended successfully!");
            res.send({message:"Data appended successfully!"});
          }
        );
      }
    );
  }
});
