require("dotenv").config()
const User = require("../model/User");
const bcrypt = require("bcryptjs");
const Cryptr = require('cryptr');
const cryptr = new Cryptr(process.env.PASS_SECRET_KEY);
const jwt = require("jsonwebtoken");


const jwtSecret = process.env.JWS_SECRET;

const nodemailer = require("nodemailer");
// const { google } = require("googleapis");
// const OAuth2 = google.auth.OAuth2;

const createTransporter = async () => {
  try {

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER_EMAIL,
        pass: process.env.APP_PASSWORD
      },
    });
    return transporter;
  } catch (err) {
    return err
  }
};

const sendMail = async (token, recipient) => {
  try {
    let body = "<p>expires in 5 minutes: "+"<a href=\"http://localhost:5123/api/auth/renderEjsWithToken?user=" + token + "\">Click to complete registration</a></p>"
    // const mailOptions = {
    //   from: process.env.USER_EMAIL,
    //   to: recipient,
    //   subject: "Test",
    //   html: body,
    // }

    let emailTransporter = await createTransporter();
    // await emailTransporter.sendMail(mailOptions);

    await emailTransporter.sendMail({
      from: 'your-email@gmail.com',
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

  const maxAge = 5 * 60;
  const token = jwt.sign(
      { username, encryptedPassword },
      jwtSecret,
      { expiresIn: maxAge }
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
          const maxAge = 3 * 60 * 60;
          const role = userIn(user, process.env.USER_EMAIL, process.env.ANDREA_ADMIN) ? "admin" : "Basic";
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
          const maxAge = 3 * 60 * 60;
          const token = jwt.sign(
            { id: user._id, username, role: user.role },
            jwtSecret,
            {
              expiresIn: maxAge, // 3hrs in sec
            }
          );
          res.cookie("jwt", token, {
            httpOnly: true,
            maxAge: maxAge * 1000, // 3hrs in ms
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
  // Verifying if role and id is presnt
  if (role && id) {
    // Verifying if the value of role is admin
    if (role === "admin") {
      // Finds the user with the id
      await User.findById(id)
        .then((user) => {
          // Verifies the user is not an admin
          if (user.role !== "admin") {
            user.role = role;
            user.save((err) => {
              //Monogodb error checker
              if (err) {
                return res
                  .status("400")
                  .json({ message: "An error occurred", error: err.message });
                process.exit(1);
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

exports.getUsers = async (req, res, next) => {
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
};
