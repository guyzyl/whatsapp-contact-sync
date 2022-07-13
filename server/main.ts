const express = require("express");
const session = require("express-session");

const app = express();
const port = process.env.PORT || 3000;

app.get("/session", (req, res) => {
  /*
  Create session or load if exists.
  */
  res.send("Hello World!");
});

app.get("/whatsapp", (req, res) => {
  res.send("Hello Whatsapp");
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
