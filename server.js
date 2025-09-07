const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const app = express();
const port = process.env.PORT || 8080;

// simple home page
app.get("/", (req, res) => {
  console.log("INFO home hit");
  res.send(`<h1>Azure + Dynatrace demo</h1>
  <ul>
    <li><a href="/api/external">/api/external</a> call to public API</li>
    <li><a href="/api/error">/api/error</a> forced error</li>
    <li><a href="/api/logfile">/api/logfile</a> write a line to a file</li>
  </ul>`);
});

// outbound dependency to create a visible edge
app.get("/api/external", async (req, res) => {
  try {
    const r = await axios.get("https://jsonplaceholder.typicode.com/todos/1", { timeout: 3000 });
    console.log("INFO external_api_ok", { status: r.status });
    res.json(r.data);
  } catch (e) {
    console.error("ERROR external_api_fail", { msg: e.message });
    res.status(502).json({ error: "upstream failed" });
  }
});

// intentional error to produce failures and exceptions
app.get("/api/error", (req, res) => {
  console.error("ERROR forced_route", { id: Date.now() });
  throw new Error("boom");
});

// write to a file so you have file logs
app.get("/api/logfile", (req, res) => {
  const logDir = "/home/logfiles";
  const file = path.join(logDir, "app-custom.log");
  try {
    fs.mkdirSync(logDir, { recursive: true });
    const line = `${new Date().toISOString()} WORKER processed job\n`;
    fs.appendFileSync(file, line);
    console.log("INFO wrote_logfile_line");
    res.json({ ok: true });
  } catch (e) {
    console.error("ERROR write_logfile_fail", { msg: e.message });
    res.status(500).json({ error: "write failed" });
  }
});

app.listen(port, () => console.log(`server listening on ${port}`));
