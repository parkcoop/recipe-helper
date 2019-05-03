const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const unirest = require("unirest");

/* GET home page */
router.get("/", (req, res, next) => {
  res.render("index");
});

router.get("/search", (req, res, next) => {
  res.render("search");
});

router.post("/search", (req, res, next) => {
  let searchTerm = req.body.query;
  unirest
    .get(
      `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/search?number=10&offset=0&query=${searchTerm}`
    )
    .header(
      "X-RapidAPI-Host",
      "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com"
    )
    .header("X-RapidAPI-Key", process.env.KEY)
    .end(function(result) {
      //call next unirest

      res.render("results", { data: result.body.results });
    });
});

router.get("/recipes/:id", (req, res, next) => {
  unirest
    .get(
      `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/${
        req.params.id
      }/information`
    )
    .header(
      "X-RapidAPI-Host",
      "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com"
    )
    .header("X-RapidAPI-Key", process.env.KEY)
    .end(function(result) {
      res.render("single-result", result.body);
    });
});
//for each to save each ingredient

router.get("/save/:id", (req, res, next) => {
  unirest
    .get(
      `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/${
        req.params.id
      }/information`
    )
    .header(
      "X-RapidAPI-Host",
      "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com"
    )
    .header("X-RapidAPI-Key", process.env.KEY)
    .end(function(result) {
      const saveThisRecipe = new Recipe({
        recipeId: result.body.id,
        title: result.body.title,
        ingredients: result.body.extendedIngredients,
        instructions: result.body.instructions,
        time: result.body.preparationMinutes
      });
      saveThisRecipe.save().then(saved => {
        console.log("saved!");
        res.redirect("/my-recipes");
      });
    });
});

router.get("/my-recipes", (req, res, next) => {
  Recipe.find().then(myRecipes => {
    // console.log(myRecipes);
    res.render("my-recipes", { savedRecipes: myRecipes });
  });
});

// router.get("/my-recipes", (req, res, next) => {
//   Recipe.find().then(myRecipes => {
//     // console.log(myRecipes);
//     res.render("my-recipes", { savedRecipes: myRecipes });
//   });
// });

router.get("/delete/:id", (req, res, next) => {
  Recipe.findByIdAndDelete(req.params.id).then(deleted => {
    console.log("deleted!");
    res.redirect("/my-recipes");
  });
});

module.exports = router;
