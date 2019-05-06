const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const recipeSchema = new Schema(
  {
    recipeId: String,
    title: { type: String },
    ingredients: Array,
    instructions: String,
    time: Number,
    owner: Schema.Types.ObjectId
  },
  {
    timestamps: true
  }
);

const Recipe = mongoose.model("Recipe", recipeSchema);

module.exports = Recipe;
