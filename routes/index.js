const express = require("express");
const router = express.Router();
const Recipe = require("../models/recipe");
const unirest = require("unirest");
const passport = require("passport");
const accountSid = process.env.SID;
const authToken = process.env.AUTHTOKEN;
const client = require("twilio")(accountSid, authToken);
const User = require("../models/user");
const Post = require("../models/post");
//const multer = require("multer");
const uploadCloud = require("../cloudinary");

router.get("/", (req, res, next) => {
  //random joke: (removed)
  // unirest
  //   .get(
  //     "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/jokes/random"
  //   )
  //   .header(
  //     "X-RapidAPI-Host",
  //     "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com"
  //   )
  //   .header("X-RapidAPI-Key", process.env.KEY)
  //   .end(function(result) {
  //     // console.log(result.body.text);
  //     res.render("index", { joke: result.body.text, user: req.user });
  //   });
  unirest
    .get(
      "https://spoonacular-recipe-food-nutrition-v1.p.rapidapi.com/food/trivia/random"
    )
    .header(
      "X-RapidAPI-Host",
      "spoonacular-recipe-food-nutrition-v1.p.rapidapi.com"
    )
    .header("X-RapidAPI-Key", process.env.KEY)
    .end(function(result) {
      res.render("index", { joke: result.body.text, user: req.user });
    });
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
      // console.log(result);
      res.render("results", { data: result.body.results, user: req.user });
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
      // console.log(result);
      res.render("single-result", { data: result.body, user: req.user });
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

router.get("/my-recipes", ensureAuthenticated, (req, res, next) => {
  Recipe.find({ owner: req.user._id }).then(myRecipes => {
    res.render("my-recipes", {
      savedRecipes: myRecipes,
      user: req.user
    });
  });
});

router.get("/my-recipes/:id", ensureAuthenticated, (req, res, next) => {
  Recipe.find({ owner: req.user._id, recipeId: req.params.id }).then(data => {
    res.render("single-user-recipe", { data: data, user: req.user });
  });
});

router.get("/edit/:id", (req, res, next) => {
  Recipe.findById(req.params.id).then(recipe => {
    res.render("edit-recipe", recipe);
  });
});
router.post("/edit/:id", (req, res, next) => {
  let updatedIngredients = [];
  if (Array.isArray(req.body.ingredients)) {
    for (let i = 0; i < req.body.ingredients.length; i++) {
      if (req.body.ingredients[i].length > 0) {
        updatedIngredients.push(req.body.ingredients[i]);
      }
    }
  } else updatedIngredients = req.body.ingredients;
  let redirectId = req.body.id;
  Recipe.findByIdAndUpdate(req.params.id, {
    title: req.body.title,
    time: req.body.time,
    ingredients: updatedIngredients,
    instructions: req.body.instructions
  })
    .then(recipe => {
      res.redirect(`/my-recipes/${redirectId}`);
    })
    .catch(err => console.log(err));
});

router.get("/delete/:id", (req, res, next) => {
  Recipe.findByIdAndDelete(req.params.id).then(deleted => {
    res.redirect("/my-recipes");
  });
});

router.post("/textRecipe", (req, res, next) => {
  // console.log(req.body);
  client.messages
    .create({
      body: `Time to start cooking! ${req.body.ingredients}`,
      from: "+13214246421",
      to: `+1${req.body.telphone}`
    })
    .then(message => {
      // console.log("message sent!");
      res.redirect("/my-recipes");
    })
    .catch(err => console.log(err));
});

// router.get("/search/users/:username", (req, res, next) => {
//   var regexp = new RegExp("^" + req.params.username, "i");
//   User.find({ username: regexp }).then(users => {
//     res.render("user-results", {
//       users: users,
//       query: req.params.username,
//       user: req.user
//     });
//   });
// });

router.get("/users/:id", (req, res, next) => {
  User.findById(req.params.id).then(user => {
    // console.log(user);
    Recipe.find({ owner: req.params.id }).then(userRecipes => {
      // console.log("this users recipes$$$$$$$$$$$$$$$$", userRecipes);
      res.render("profile", {
        foundUser: user,
        userRecipes: userRecipes,
        user: req.user
      });
    });
  });
});

router.get("/addPhoto", (req, res, next) => {
  res.render("photo-add", { user: req.user });
});

// console.log(uploadCloud);

router.post("/addPhoto", uploadCloud.single("photo"), (req, res, next) => {
  // console.log("youll see the pic as req.file", req.file);

  User.findByIdAndUpdate(req.user._id, {
    avatar: req.file.url
  })
    .then(res.redirect("/"))
    .catch(err => console.log(err));
  // res.redirect("back");
});

router.post("/search/users", (req, res, next) => {
  // console.log(req.body.query);
  var regexp = new RegExp("^" + req.body.query, "i");
  User.find({ username: regexp }).then(users => {
    res.render("user-results", {
      users: users,
      query: req.body.query,
      user: req.user
    });
  });
});

router.get("/nutrition/:id", (req, res, next) => {
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
//http://localhost:3000/followUser/5ccb1c37d2b6aa25f28b27d3
router.get("/followUser/:userId", ensureAuthenticated, (req, res, next) => {
  console.log(req.params.userId, req.user._id);

  if (req.params.userId != req.user._id) {
    let updatedFollowers = [];
    User.findById(req.user._id).then(thisUser => {
      // console.log(
      //   `Does ${thisUser.following} include ${req.user._id}   ???????`
      // );
      // console.log(!thisUser.following.includes(req.user._id));
      if (!thisUser.following.includes(req.params._id)) {
        for (let i = 0; i < thisUser.following.length; i++) {
          updatedFollowers.push(thisUser.following[i]);
        }
        updatedFollowers.push(req.params.userId);
        User.findOneAndUpdate(
          { _id: req.user._id },
          {
            following: updatedFollowers
          }
        )
          .then(updated => {
            console.log("followers updated!");
            res.redirect("/newsfeed");
          })
          .catch(err => console.log(err));
      } else {
        res.send("YOu already follow that person...");
      }
    });
  } else {
    res.send("please dont try to follow yourself in public");
  }
});

router.get("/newsfeed", ensureAuthenticated, (req, res, next) => {
  User.findById(req.user._id).then(thisUser => {
    console.log(thisUser.following);
    Post.find({ owner: { $in: thisUser.following } })
      .sort([["date", -1]])
      .populate("owner")
      .then(followersPosts => {
        res.render("news-feed", {
          followersPosts: followersPosts,
          user: req.user
        });
      });
  });
});

router.get("/myhomepage", ensureAuthenticated, (req, res, next) => {
  User.findById(req.user._id).then(me => {
    Recipe.find({ owner: req.user._id }).then(userRecipes => {
      Post.find({ owner: req.user._id })
        .sort([["date", -1]])
        .then(myPosts => {
          res.render("home-page", {
            data: me,
            userRecipes: userRecipes,
            user: req.user,
            sharedPost: myPosts
          });
        });
    });
  });
});

router.get("/shareImage", ensureAuthenticated, (req, res, next) => {
  res.render("share-post");
});

router.post("/shareImage", uploadCloud.single("photo"), (req, res, next) => {
  // console.log(req);
  const newSharePost = new Post({
    title: req.body.postBody,
    image: req.file.url,
    date: Date.now(),
    owner: req.user._id
  });
  newSharePost.save().then(updatedNewsFeed => {
    console.log("post published!");
    res.redirect("/newsfeed");
  });
});
//5cd111cf27db5221cfa024e1/559371
// router.get("/user-recipes/:userId/:recipeId", (req, res, next) => {
//   console.log(`User ${req.params.userId}'s recipe ${req.params.recipeId} `);
//   Recipe.find({
//     owner: req.params.userId
//   }).then(data => {
//     console.log(data);
//     res.render("single-user-recipe", { data: data, user: req.user });
//   });
// });

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;
