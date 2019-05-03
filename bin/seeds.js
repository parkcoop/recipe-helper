const mongoose = require("mongoose");
const Recipe = require("../models/recipe");

const dbName = "recipehelper";
mongoose.connect(`mongodb://localhost/${dbName}`);

const recipe = [
  {
    title: "PB&J",
    ingredients: ["bread", "peanut butter", "jelly"],
    description: "A classic sandwich we all love",
    time: 10
  },
  {
    title: "Spaghetti Bolognese",
    ingredients: ["pasta", "bolognese sauce"],
    description: "An Italian favorite among many Americans",
    time: 30
  },
  {
    title: "Fried chicken",
    ingredients: ["grease", "chicken", "flour"],
    description: "We all love fried chicken",
    time: 60
  }
];

Recipe.create(recipe, err => {
  if (err) {
    throw err;
  }
  console.log(`Created ${recipe.length} recipes`);
  mongoose.connection.close();
});
