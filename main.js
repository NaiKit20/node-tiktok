const express = require("express");
const { WebcastPushConnection } = require("tiktok-live-connector");
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors({ origin: "*" }));

app.get("/tiktok/:id", (req, res) => {
  const sessionId = "e33cac6c9d1170b58093916262d873b0";
  // tiktok connect
  const tiktokUsername = req.params.id;
  const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername , {sessionId});

  tiktokLiveConnection
    .connect()
    .then((state) => {
      console.info(`Connected to roomId ${state.roomId}`);
    })
    .catch((err) => {
      console.error("Failed to connect", err);
    });

  try {
    // เชื่อมต่อแบบ SSE
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      Connection: "keep-alive",
    });
    // Event comments
    tiktokLiveConnection.on("chat", (data) => {
      const message = `${data.uniqueId} (userId:${data.userId})writes:${data.comment}`;
      // Respond with the message
      res.write(`data: ${JSON.stringify(message)}\n\n`);
    });

    // ตัดการเชื่อมต่อแบบ SSE
    req.on("close", () => {
      tiktokLiveConnection.disconnect();
      console.info(`Disconnected`);
    });
  } catch (error) {
    console.error("Error handling request:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});




