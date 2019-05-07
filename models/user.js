const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: { type: String, unique: true },
    password: String,
    following: Array,
    avatar: {
      type: String,
      default:
        "https://res.cloudinary.com/parkcoop/image/upload/v1557244076/recipe-helper/blank.png.png"
    }
  },
  {
    timestamps: true
  }
);

const User = mongoose.model("User", userSchema);

module.exports = User;
