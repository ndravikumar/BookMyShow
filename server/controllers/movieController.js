const MovieModel = require("../models/movieSchema");

const addMovie = async (req, res) => {
  try {
    const newMovie = new MovieModel(req?.body);
    const movie = await MovieModel.findOne({ movieName: req?.body?.movieName });
    if (movie) {
      return res.send({
        success: false,
        message: "Movie already there in list.",
      });
    }
    await newMovie.save();
    res.send({
      success: true,
      message: "New Movie has been added",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};
const mongoose = require("mongoose");
const getAllMovies = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction({ readConcern: { level: "snapshot" } });
    const allMovies = await MovieModel.find().session(session);
    await session.commitTransaction();
    session.endSession();
    res.send({
      success: true,
      message: "All movies has been fetched",
      data: allMovies,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.send({
      success: false,
      message: error.message,
    });
  }
};
const updateMovie = async (req, res) => {
  try {
    const movie = await MovieModel.findByIdAndUpdate(
      req?.body?.movieId,
      req.body,
      { new: true }
    );
    res.send({
      success: true,
      message: "The Movie has been Updated",
      data: movie,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};
const deleteMovie = async (req, res) => {
  try {
    const movieId = req.params.movieId;
    await MovieModel.findByIdAndDelete(movieId);
    res.send({
      success: true,
      message: "The Movie has been deleted",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};

const getMovieById = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction({ readConcern: { level: "snapshot" } });
    const movie = await MovieModel.findById(req.params.id).session(session);
    await session.commitTransaction();
    session.endSession();
    res.send({
      success: true,
      message: "Movie fetched successfully!",
      data: movie,
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    res.send({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  addMovie,
  getAllMovies,
  updateMovie,
  deleteMovie,
  getMovieById,
};
