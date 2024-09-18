const express = require("express");
const { WebcastPushConnection } = require("tiktok-live-connector");
const cors = require("cors");
const https = require("https");
const fs = require("fs");

const app = express();
const port = 3000;

// ใช้ใบรับรองจาก Certificate Authority (CA) และคีย์ส่วนตัว
const sslOptions = {
  key: fs.readFileSync("cert/private-key.key"), // ไฟล์คีย์ส่วนตัว
  cert: fs.readFileSync("cert/cslab_it_msu_ac_th.bundle.crt"), // ไฟล์ใบรับรองแบบ bundle
};

app.use(cors({ origin: "*" })); // run

app.get("/", (req, res) => {
  res.send("Hello World");
});

app.get("/tiktok/:id", (req, res) => {
  const tiktokUsername = req.params.id;
  const tiktokLiveConnection = new WebcastPushConnection(tiktokUsername, {
    requestOptions: {
      timeout: 30000
    }
  });

  tiktokLiveConnection
    .connect()
    .then((state) => {
      console.info(`Connected to roomId ${state.roomId}`);

      // ตั้งค่า header สำหรับ SSE
      res.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      // Event comments
      tiktokLiveConnection.on("chat", (data) => {
        const message = `${data.uniqueId}:${data.userId}:${data.comment}`;
        // Respond with the message
        res.write(`data: ${JSON.stringify(message)}\n\n`);
      });

      // ตัดการเชื่อมต่อแบบ SSE
      req.on("close", () => {
        tiktokLiveConnection.disconnect();
        res.end();
        console.info(`Disconnected`);
      });
    })
    .catch((err) => {
      console.error("Failed to connect", err);
    });
});

// สร้าง HTTPS server ด้วยใบรับรองและคีย์ส่วนตัว
https.createServer(sslOptions, app).listen(port, () => {
  console.log(`HTTPS Server is running on port ${port}`);
});
