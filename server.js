const express = require("express");
const axios = require('axios');
const connectDB = require("./db");
const app = express();
const cookieParser = require("cookie-parser");
const { adminAuth, userAuth } = require("./middleware/auth.js");
const { exec } = require('child_process');


const PORT = 5123;

app.set("view engine", "ejs");

connectDB();

command = `open -a "Brave Browser" http://localhost:5123/register`;
exec(command);


app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api/auth", require("./Auth/route"));

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

app.get('/yo', async (req, res) => {
  res.status(200).json("yello");
});
app.get('/proxy', async (req, res) => {
  try {
    const { url, body, method } = req.body;

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

const server = app.listen(PORT, () =>
  console.log(`Server Connected to port ${PORT}`)
);

process.on("unhandledRejection", (err) => {
  console.log(`An error occurred: ${err.message}`);
  server.close(() => process.exit(1));
});

