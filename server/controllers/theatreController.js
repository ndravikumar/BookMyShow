const Theatre = require("../models/theatreSchema");

const addTheatre = async (req, res) => {
  try {
    const newTheatre = new Theatre(req?.body);
    await newTheatre.save();
    res.send({
      success: true,
      message: "New Theatre has been added",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};

const updateTheatre = async (req, res) => {
  try {
    const theatre = await Theatre.findByIdAndUpdate(
      req?.body?.theatreId,
      req.body,
      { new: true }
    );
    res.send({
      success: true,
      message: "The Theatre has been Updated",
      data: theatre,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};

const deleteTheatre = async (req, res) => {
  try {
    const theatreId = req.params.theatreId;
    await Theatre.findByIdAndDelete(theatreId);
    res.send({
      success: true,
      message: "The Theatre has been deleted",
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};

const getAllTheatres = async (req, res) => {
  try {
    const theatres = await Theatre.find().populate("owner");
    res.send({
      success: true,
      message: "All theatres has been fetched",
      data: theatres,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};

const getAllTheatresByOwner = async (req, res) => {
  try {
    const theatres = await Theatre.find({ owner: req?.body?.userId });
    res.send({
      success: true,
      message: "All theatres has been fetched",
      data: theatres,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addTheatre,
  updateTheatre,
  deleteTheatre,
  getAllTheatres,
  getAllTheatresByOwner,
};
