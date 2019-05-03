const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const unirest = require("unirest");
const passport = require("passport");

router.get("/", (req, res, next) => {
  res.render("index", { user: req.user });
});

router.get("/search", (req, res, next) => {
  res.render("search", { user: req.user });
});

router.post("/search", (req, res, next) => {
  let searchTerm = req.body.query;
  unirest
    .get(
      `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/search?number=25&offset=0&query=${searchTerm}`
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

router.get("/save/:id", ensureAuthenticated, (req, res, next) => {
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
        time: result.body.preparationMinutes,
        owner: req.user._id
      });
      saveThisRecipe.save().then(saved => {
        console.log("saved!");
        res.redirect("/my-recipes");
      });
    });
});

router.get("/my-recipes", ensureAuthenticated, (req, res, next) => {
  Recipe.find({ owner: req.user._id }).then(myRecipes => {
    res.render("my-recipes", { savedRecipes: myRecipes });
  });
});

router.get("/delete/:id", (req, res, next) => {
  Recipe.findByIdAndDelete(req.params.id).then(deleted => {
    console.log("deleted!");
    res.redirect("/my-recipes");
  });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;
