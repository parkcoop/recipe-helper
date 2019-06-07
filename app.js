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

mongoose.Promise = Promise;

mongoose
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

app.use(
  require("node-sass-middleware")({
    src: path.join(__dirname, "public"),
    dest: path.join(__dirname, "public"),
    sourceMap: true
  })
);

const rateLimit = require("express-rate-limit");

app.enable("trust proxy");

const apiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 60 minutes
  max: 10
});

app.use("/api", apiLimiter);

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
  return dateFormat(context, "dddd, mmmm dS, yyyy, h:MM:ss TT");
});
app.locals.title = "Recipe Helper";

const auth = require("./routes/auth-routes");
app.use("/", auth);

const index = require("./routes/index");
app.use("/", index);

const api = require("./routes/api");
app.use("/api", api);

module.exports = app;
