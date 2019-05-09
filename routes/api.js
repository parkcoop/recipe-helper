const express = require("express");
const api = express.Router();
const Recipe = require("../models/recipe");
const unirest = require("unirest");

const accountSid = process.env.SID;
const authToken = process.env.AUTHTOKEN;
const client = require("twilio")(accountSid, authToken);
const User = require("../models/user");
const Post = require("../models/post");
//const multer = require("multer");
const uploadCloud = require("../cloudinary");

api.post("/search", (req, res, next) => {
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
      // console.log(result);
      res.render("results", { data: result.body.results, user: req.user });
    });
});

api.get("/recipes/:id", (req, res, next) => {
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
      // console.log(result);
      res.render("single-result", { data: result.body, user: req.user });
    });
});

api.get("/save/:id", ensureAuthenticated, (req, res, next) => {
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
      let ingredientsArray = [];
      for (let i = 0; i < result.body.extendedIngredients.length; i++) {
        ingredientsArray.push(
          result.body.extendedIngredients[i].originalString
        );
      }
      // console.log(ingredientsArray);
      const saveThisRecipe = new Recipe({
        recipeId: result.body.id,
        title: result.body.title,
        ingredients: ingredientsArray,
        instructions: result.body.instructions,
        time: result.body.preparationMinutes,
        imgURL: result.body.image,
        owner: req.user._id
      });
      saveThisRecipe
        .save()
        .then(saved => {
          // console.log(
          //   `${req.user.username} just added ${
          //     result.body.title
          //   } to his recipe book!`
          // );
          const newPostToPublish = new Post({
            title: `${req.user.username} just added ${
              result.body.title
            } to their recipe book!`,
            date: Date.now(),
            owner: req.user._id
          });
          newPostToPublish.save().then(updatedNewsFeed => {
            console.log("post published!");
            res.redirect("/my-recipes");
          });
        })
        .catch(err => console.log(err));
    });
});

api.get("/nutrition/:id", (req, res, next) => {
  unirest
    .get(
      `https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/recipes/${
        req.params.id
      }/nutritionWidget.json`
    )
    .header(
      "X-RapidAPI-Host",
      "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com"
    )
    .header("X-RapidAPI-Key", process.env.KEY)
    .end(function(result) {
      // console.log(result);
      const goodNutritionItems = [];
      const goodNutritionAmounts = [];
      for (let i = 0; i < result.body.good.length; i++) {
        // console.log(result.body.good[i].title);
        // console.log(result.body.good[i].percentOfDailyNeeds);
        goodNutritionItems.push(result.body.good[i].title);
        goodNutritionAmounts.push(result.body.good[i].percentOfDailyNeeds);
      }
      goodNutrition = {
        titles: goodNutritionItems,
        amounts: goodNutritionAmounts
      };
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
        .end(function(recipeData) {
          res.render("nutrition", {
            data: result,
            nutritionFacts: goodNutrition,
            user: req.user,
            recipeData: recipeData
          });
        });
    });
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = api;
