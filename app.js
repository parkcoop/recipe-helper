require("dotenv").config();

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const express = require("express");
const favicon = require("serve-favicon");
const hbs = require("hbs");
const mongoose = require("mongoose");
const logger = require("morgan");
const path = require("path");
const session = require("express-session");
const bcrypt = require("bcrypt");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const dateFormat = require("dateformat");
const User = require("./models/user");
const flash = require("connect-flash");
const accountSid = process.env.SID;
const authToken = process.env.AUTHTOKEN;
const client = require("twilio")(accountSid, authToken);

// const MongoClient = require(‘mongodb’).MongoClient;
// const uri = "mongodb+srv://parkcoop:<password>@cluster0-mvuct.mongodb.net/test?retryWrites=true";
// const client = new MongoClient(uri, { useNewUrlParser: true });
// client.connect(err => {
//   const collection = client.db("test").collection("devices");
//   // perform actions on the collection object
//   client.close();
// });
mongoose.Promise = Promise;

mongoose
  // .connect("mongodb://localhost/recipehelper", { useNewUrlParser: true })
  .connect(process.env.MONGO, { useNewUrlParser: true })
  .then(x => {
    console.log(
      `Connected to Mongo! Database name: "${x.connections[0].name}"`
    );
  })
  .catch(err => {
    console.error("Error connecting to mongo", err);
  });

const app_name = require("./package.json").name;
const debug = require("debug")(
  `${app_name}:${path.basename(__filename).split(".")[0]}`
);

const app = express();

// Middleware Setup
app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(
  session({
    secret: "our-passport-local-strategy-app",
    resave: true,
    saveUninitialized: true
  })
);

passport.serializeUser((user, cb) => {
  cb(null, user._id);
});

passport.deserializeUser((id, cb) => {
  User.findById(id, (err, user) => {
    if (err) {
      return cb(err);
    }
    cb(null, user);
  });
});
app.use(flash());
passport.use(
  new LocalStrategy(
    {
      passReqToCallback: true
    },
    (req, username, password, next) => {
      User.findOne({ username }, (err, user) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return next(null, false, { message: "Incorrect username" });
        }
        if (!bcrypt.compareSync(password, user.password)) {
          return next(null, false, { message: "Incorrect password" });
        }

        return next(null, user);
      });
    }
  )
);

app.use(passport.initialize());
app.use(passport.session());
// Express View engine setup

app.use(
  require("node-sass-middleware")({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    sourceMap: true
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
app.use(express.static(path.join(__dirname, "public")));
app.use(favicon(path.join(__dirname, "public", "images", "favicon.ico")));
hbs.registerHelper("sentence-case", function(context) {
  return context.replace(/\w\S*/g, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
});
hbs.registerHelper("post-case", function(context) {
  return context.charAt(0).toUpperCase() + context.substr(1).toLowerCase();
});
hbs.registerHelper("parseInt", function(context) {
  return parseInt(context);
});
hbs.registerHelper("reformatDate", function(context) {
  // return context.toLocaleDateString();
  return dateFormat(context, "dddd, mmmm dS, yyyy, h:MM:ss TT");
});
// default value for title local
app.locals.title = "Recipe Helper";

const auth = require("./routes/auth-routes");
app.use("/", auth);

const index = require("./routes/index");
app.use("/", index);

module.exports = app;
