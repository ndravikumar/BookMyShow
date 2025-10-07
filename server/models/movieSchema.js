const mongoose = require("mongoose");

const movieSchema = mongoose.Schema({
  movieName: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    requried: true,
  },
  duration: {
    type: Number,
    requried: true,
  },
  genre: {
    type: String,
    required: true,
  },
  language: {
    // convert into array pan india movies
    type: String,
    required: true,
  },
  releaseDate: {
    type: Date,
    required: true,
  },
  poster: {
    type: String,
    required: true,
  },
});

const Movies = mongoose.model("movies", movieSchema);

module.exports = Movies;
