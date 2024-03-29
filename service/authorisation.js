
const config = require('config');
const ADMIN_AUTHORIZATION_LABEL = config.get('ADMIN_AUTHORIZATION_LABEL');
const BASIC_AUTHORIZATION_LABEL = config.get('BASIC_AUTHORIZATION_LABEL');

require("dotenv").config()
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.FRONTEND_JWS_SECRET;

exports.adminAuth = (req, res, next) => {
  checkAuthorisation(req, res, next, ADMIN_AUTHORIZATION_LABEL)
};
exports.userAuth = (req, res, next) => {
  checkAuthorisation(req, res, next, BASIC_AUTHORIZATION_LABEL)
};

function checkAuthorisation(req, res, next, type){
  const token = req.cookies.jwt;
  if (token) {
    jwt.verify(token, jwtSecret, (err, decodedToken) => {
      if (err) {
        return res.status(401).json({ message: "Not authorized" });
      } else {
        if (decodedToken.role === ADMIN_AUTHORIZATION_LABEL) {
          next();
        }
        if (decodedToken.role !== type) {
          return res.status(401).json({ message: "Not authorized" });
        } else {
          next();
        }
      }
    });
  } else {
    return res
      .status(401)
      .json({ message: "Not authorized, token not available" });
  }
}