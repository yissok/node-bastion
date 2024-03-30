require("dotenv").config()
const config = require('config');
const MAX_AGE_SESSION = config.get('MAX_AGE_SESSION');
const MAX_AGE_REGISTRATION_LINK = config.get('MAX_AGE_REGISTRATION_LINK');
const HOST = config.get('HOST');

const User = require("../model/user");
const bcrypt = require("bcryptjs");
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.FRONTEND_ENCRYPTION_KEY);
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.FRONTEND_JWS_SECRET;
const nodemailer = require("nodemailer");

const createTransporter = async () => {
  try {

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.FRONTEND_ADMIN_SENDER_EMAIL,
        pass: process.env.FRONTEND_APP_PASSWORD
      },
    });
    return transporter;
  } catch (err) {
    return err
  }
};

const sendMail = async (token, recipient) => {
  try {
    let body = "<p>expires in 5 minutes: "+"<a href=\"https://"+HOST+"/api/auth/renderEjsWithToken?user=" + token + "\">Click to complete registration</a></p>"
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail({
      from: process.env.FRONTEND_ADMIN_SENDER_EMAIL,
      to: recipient,
      subject: 'test',
      text: '',
      html: body,
    });
  } catch (err) {
    console.log("ERROR: ", err)
  }
};


exports.renderEjsWithToken = async (req, res, next) => {
  const user = req.query.user;
  res.render('registerPassword', { user });
};

exports.register = async (req, res, next) => {
  const { username, password } = req.body;
  const encryptedPassword = cryptr.encrypt(password);
  const token = jwt.sign(
      { username, encryptedPassword },
      jwtSecret,
      { expiresIn: MAX_AGE_REGISTRATION_LINK }
  );

  await sendMail(token,username)//remove whole then part, we want the token to only be available through email because that's the way we can guarantee that one user cannot create infinite accounts
      .then(() => {
    res.status(201).json({
      message: token,
    })
  })
      .catch(error => {
        console.log("err: "+error)
      });
};



exports.registerPass = async (req, res, next) => {
  const { token } = req.body;
  jwt.verify(token, jwtSecret, (err, decodedToken) => {

    if (err) {
      console.log("err: "+err)
      return res.status(401).json({ message: "Not authorized" });
    } else {
      const pw = cryptr.decrypt(decodedToken.encryptedPassword);
      console.log("valid token")
      console.log("decodedToken: "+decodedToken.username)
      console.log("decodedTokenpw: "+decodedToken.encryptedPassword)
      console.log("decodedTokenpwdec: "+pw)
      registerUser(pw, decodedToken.username, res)
    }
  });
};

function registerUser(password, username, res) {

  if (password.length < 6) {
    return res.status(400).json({ message: "Password less than 6 characters" });
  }
  bcrypt.hash(password, 10).then(async (hash) => {
    await User.create({
      username,
      password: hash,
    })
        .then((user) => {
          const role = userIn(user, process.env.FRONTEND_ADMIN_SENDER_EMAIL, process.env.FRONTEND_ANDREA_ADMIN_EMAIL) ? "admin" : "Basic";
          res.status(201).json({
            message: "User successfully created",
            user: user._id,
            role: role,
          });
        })
        .catch((error) =>
            res.status(400).json({
              message: "User not created",
              error: error.message,
            })
        );
  });
}

function userIn(user, ...emails) {
  return emails.includes(user);
}

exports.login = async (req, res, next) => {
  const { username, password } = req.body;

  // Check if username and password is provided
  if (!username || !password) {
    return res.status(400).json({
      message: "Username or Password not present",
    });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      res.status(400).json({
        message: "Login not successful",
        error: "User not found",
      });
    } else {
      // comparing given password with hashed password
      bcrypt.compare(password, user.password).then(function (result) {
        if (result) {
          const token = jwt.sign(
            { id: user._id, username, role: user.role },
            jwtSecret,
            {
              expiresIn: MAX_AGE_SESSION, // 3hrs in sec
            }
          );
          res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: MAX_AGE_SESSION * 1000, // 3hrs in ms
          });
          res.status(201).json({
            message: "User successfully Logged in",
            user: user._id,
            role: user.role,
          });
        } else {
          res.status(400).json({ message: "Login not succesful" });
        }
      });
    }
  } catch (error) {
    res.status(400).json({
      message: "An error occurred",
      error: error.message,
    });
  }
};

exports.update = async (req, res, next) => {
  const { role, id } = req.body;
  if (role && id) {
    if (role === "admin") {
      await User.findById(id)
        .then((user) => {
          if (user.role !== "admin") {
            user.role = role;
            user.save((err) => {
              if (err) {
                return res
                  .status("400")
                  .json({ message: "An error occurred", error: err.message });
              }
              res.status("201").json({ message: "Update successful", user });
            });
          } else {
            res.status(400).json({ message: "User is already an Admin" });
          }
        })
        .catch((error) => {
          res
            .status(400)
            .json({ message: "An error occurred", error: error.message });
        });
    } else {
      res.status(400).json({
        message: "Role is not admin",
      });
    }
  } else {
    res.status(400).json({ message: "Role or Id not present" });
  }
};

exports.deleteUser = async (req, res, next) => {
  const { id } = req.body;
  await User.findById(id)
    .then((user) => user.remove())
    .then((user) =>
      res.status(201).json({ message: "User successfully deleted", user })
    )
    .catch((error) =>
      res
        .status(400)
        .json({ message: "An error occurred", error: error.message })
    );
};

exports.getSingleUser = async (req, res, next) => {
  const token = req.cookies.jwt;

  jwt.verify(token, jwtSecret, (err, decodedToken) => {

    if (err) {
      console.log("err: "+err)
      return res.status(401).json({ message: "Not authorized" });
    } else {
      console.log("id: "+decodedToken.id)
      console.log("username: "+decodedToken.username)
      console.log("role: "+decodedToken.role)
      const timeLeft = (decodedToken.exp - Math.floor(Date.now()/1000))
      console.log("time left: " + timeLeft);
      User.findById(decodedToken.id)
        .then((user) =>
          res.status(200).json({ message: "User found", user, timeLeft })
        )
        .catch((error) =>
          res
            .status(400)
            .json({ message: "An error occurred", error: error.message })
        );
    }
  });
};

exports.getUsers = async (req, res, next) => {
  if (role && id) {
    if (role === "admin") {
      await User.find({})
        .then((users) => {
          const userFunction = users.map((user) => {
            const container = {};
            container.username = user.username;
            container.role = user.role;
            container.id = user._id;
    
            return container;
          });
          res.status(200).json({ user: userFunction });
        })
        .catch((err) =>
          res.status(401).json({ message: "Not successful", error: err.message })
        );
    }
  }
};
