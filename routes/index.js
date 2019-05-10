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
const Fact = require("../models/fact");
const uploadCloud = require("../cloudinary");

router.get("/", (req, res, next) => {
  Fact.count().exec(function(err, count) {
    var random = Math.floor(Math.random() * count);
    Fact.findOne()
      .skip(random)
      .exec(function(err, result) {
        console.log(result);
        res.render("index", { joke: result.content, user: req.user });
      });
  });
});

router.get("/search", (req, res, next) => {
  res.render("search", { user: req.user });
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
  client.messages
    .create({
      body: `Time to start cooking! ${req.body.ingredients}`,
      from: "+13214246421",
      to: `+1${req.body.telphone}`
    })
    .then(message => {
      res.redirect("/my-recipes");
    })
    .catch(err => console.log(err));
});

router.get("/users/:id", (req, res, next) => {
  User.findById(req.params.id).then(user => {
    Recipe.find({ owner: req.params.id }).then(userRecipes => {
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

router.post("/addPhoto", uploadCloud.single("photo"), (req, res, next) => {
  User.findByIdAndUpdate(req.user._id, {
    avatar: req.file.url
  })
    .then(res.redirect("/"))
    .catch(err => console.log(err));
});

router.post("/search/users", (req, res, next) => {
  var regexp = new RegExp("^" + req.body.query, "i");
  User.find({ username: regexp }).then(users => {
    res.render("user-results", {
      users: users,
      query: req.body.query,
      user: req.user
    });
  });
});

router.get("/followUser/:userId", ensureAuthenticated, (req, res, next) => {
  console.log(req.params.userId, req.user._id);

  if (req.params.userId != req.user._id) {
    let updatedFollowers = [];
    User.findById(req.user._id).then(thisUser => {
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

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect("/login");
  }
}

module.exports = router;
