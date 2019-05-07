const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recipeSchema = new Schema(
  {
    recipeId: String,
    title: String,
    ingredients: Array,
    instructions: String,
    time: Number,
    imgURL: String,
    owner: Schema.Types.ObjectId,
    numberOfLikes: Number
  },
  {
    timestamps: true
  }
);

const Recipe = mongoose.model("Recipe", recipeSchema);

module.exports = Recipe;
