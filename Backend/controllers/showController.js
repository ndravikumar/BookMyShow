const Show = require("../models/showSchema");

const addShow = async (req, res) => {
  try {
    const newShow = new Show(req?.body);
    newShow.save();
    res.send({
      success: true,
      message: "New show has been added!",
    });
  } catch (error) {
    res.send({
      status: false,
      message: error.message,
    });
  }
};

const updateShow = async (req, res) => {
  try {
    await Show.findByIdAndUpdate(req.body.showId, req.body);
    res.send({
      success: true,
      message: "The show has been updated!",
    });
  } catch (error) {
    res.send({
      status: false,
      message: error.message,
    });
  }
};

const deleteShow = async (req, res) => {
  try {
    await Show.findByIdAndDelete(req.params.showId);
    res.send({
      success: true,
      message: "The show has been deleted!",
    });
  } catch (error) {
    res.send({
      status: false,
      message: error.message,
    });
  }
};

const getAllShowsByTheatre = async (req, res) => {
  try {
    const shows = await Show.find({ theatre: req.body.theatreId }).populate(
      "movie"
    );
    res.send({
      success: true,
      message: "All shows are fetched",
      data: shows,
    });
  } catch (error) {
    res.send({
      status: false,
      message: error.message,
    });
  }
};

const getAllTheatersByMovie = async (req, res) => {
  console.log(req.body, "get");
  
  try {
    const { movie, date } = req.body;
    const shows = await Show.find({ movie, date }).populate("theatre");

    let uniqueTheatre = [];
    shows.forEach((show) => {
      const theatre = uniqueTheatre.find(
        (theatre) => theatre._id === show.theatre._id
      );
      if (!theatre) {
        const showsOfThisTheatre = shows.filter(
          (showObj) => showObj.theatre._id === show.theatre._id
        );
        uniqueTheatre.push({
          ...show.theatre._doc,
          shows: showsOfThisTheatre,
        });
      }
    });

    res.send({
      success: true,
      message: "All Theatres are fetched",
      data: uniqueTheatre,
    });
  } catch (error) {
    res.send({
      status: false,
      message: error.message,
    });
  }
};

const getShowById = async (req, res) => {
  try {
    const shows = await Show.findById(req.body.showId)
      .populate("movie")
      .populate("theatre");
    res.send({
      success: true,
      message: "All shows are fetched",
      data: shows,
    });
  } catch (error) {
    res.send({
      status: false,
      message: error.message,
    });
  }
};

module.exports = {
  addShow,
  updateShow,
  deleteShow,
  getAllShowsByTheatre,
  getAllTheatersByMovie,
  getShowById,
};
