const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const factSchema = new Schema({
  content: String
});

const Fact = mongoose.model("Fact", factSchema);

module.exports = Fact;
