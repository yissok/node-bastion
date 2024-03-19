const Mongoose = require("mongoose");
require("dotenv").config()

const user = process.env.DB_USERNAME
const pass = process.env.DB_MONGOUSER_PASSWORD
const localDB = `mongodb+srv://${user}:${pass}@cluster0.xecpsrk.mongodb.net/?authMechanism=DEFAULT`;
Mongoose.set('strictQuery', true);
const connectDB = async () => {
  await Mongoose.connect(localDB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log("MongoDB Connected");
};

module.exports = connectDB;
