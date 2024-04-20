
const config = require('config');
const HOST = config.get('HOST');

const express = require("express");
const axios = require('axios');
const connectDB = require("./misc/db.js");
const app = express();
const cookieParser = require("cookie-parser");
const { adminAuth, userAuth } = require("./service/authorisation.js");
const { exec } = require('child_process');

var https = require('https');
var fs = require('fs');
var https_options = {
  key: fs.readFileSync("misc/certs/yissok.online.key"),
  cert: fs.readFileSync("misc/certs/yissok_online.crt")
  // ,
  // ca: [
  // fs.readFileSync('misc/certs/My_CA_Bundle.ca-bundle')
  // ]
 };
const PORT = 443;

app.set("view engine", "ejs");

connectDB();

if (process.platform === 'darwin') {
  console.log(process.platform)
  command = `open -a "Brave Browser" https://${HOST}/register`;
  exec(command);  
}


app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./routes/route.js"));

app.get("/", (req, res) => res.render("home"));
app.get("/register", (req, res) => res.render("registerUsername"));
app.get("/checkEmail", (req, res) => res.render("checkEmail"));
app.get("/registerPass", (req, res) => res.render("registerPassword"));
app.get("/login", (req, res) => res.render("login"));
app.get("/logout", (req, res) => {
  res.cookie("jwt", "", { maxAge: "1" });
  res.redirect("/");
});

app.get("/admin", adminAuth, (req, res) => res.render("admin"));
app.get("/basic", userAuth, (req, res) => res.render("user"));
app.get('/proxy', userAuth, async (req, res) => {
  try {
    // const { url, body, method } = req.body;
    const { url, method } = req.body;

    if (!url || !method) {
      return res.status(400).json({ error: 'url and method are required' });
    }

    const response = await axios.get(url)

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error(error);
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});


const server = https.createServer(https_options, app).listen(PORT, () =>
console.log(`Server Connected to port ${PORT}`)
);

process.on("unhandledRejection", (err) => {
  console.log(`An error occurred: ${err.message}`);
  server.close(() => process.exit(1));
});

