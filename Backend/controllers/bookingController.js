const Booking = require("../models/bookingSchema");
const Show = require("../models/showSchema");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_KEY);

const makePayment = async (req, res) => {
  try {
    const { token, amount } = req.body;

    const customers = await stripe.customers.list({
      email: token.email,
      limit: 1,
    });

    const currCustomer = null;
    if (customers.data.length > 0) {
      currCustomer = customers.data[0];
    } else {
      const createNewCustomer = async () => {
        return await stripe.customers.create({
          source: token.id,
          email: token.email,
        });
      };
      currCustomer = await createNewCustomer();
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      customer: currCustomer.id,
      payment_method_types: ["card"],
      receipt_email: token.email,
      description: "Token has been assigned to the movie",
    });
    const transactionId = paymentIntent.id;
    res.send({
      success: true,
      message: "Payment Successfull ! Tickets Booked",
      data: transactionId,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};

const bookShow = async (req, res) => {
  try {
    const show = await Show.findById(req.body.show).populate("movie");
    // Check if any requested seat is already booked
    const seatAlreadyBooked = req.body.seats.some((seat) => show.bookedSeats.includes(seat));
    if (seatAlreadyBooked) {
      return res.status(409).send({
        success: false,
        message: "One or more seats are already booked.",
      });
    }

    const newBooking = new Booking(req.body);
    await newBooking.save();

    const updatedBookedSeats = [...show.bookedSeats, ...req.body.seats];
    await Show.findByIdAndUpdate(req.body.show, {
      bookedSeats: updatedBookedSeats,
    });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate("user")
      .populate("show")
      .populate({
        path: "show",
        populate: {
          path: "movie",
          model: "movies",
        },
      })
      .populate({
        path: "show",
        populate: {
          path: "theatre",
          model: "theatres",
        },
      });

    // Format date using luxon
    const { DateTime } = require("luxon");
    const formattedDate = DateTime.fromJSDate(populatedBooking.show.date).toFormat("yyyy LLL dd");
    await EmailHelper("ticketTemplate.html", populatedBooking.user.email, {
      name: populatedBooking.user.name,
      movie: populatedBooking.show.movie.movieName,
      theatre: populatedBooking.show.theatre.name,
      date: formattedDate,
      time: populatedBooking.show.time,
      seats: populatedBooking.seats,
      amount: populatedBooking.seats.length * populatedBooking.show.ticketPrice,
      transactionId: populatedBooking.transactionId,
    });

    res.send({
      success: true,
      message: "New Booking done!",
      data: newBooking,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

const getAllBookings = async (req, res) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction({ readConcern: { level: "snapshot" } });
    const bookings = await Booking.find({ user: req.body.userId })
      .populate("user")
      .populate("show")
      .populate({
        path: "show",
        populate: {
          path: "movie",
          model: "shows",
        },
      })
      .populate({
        path: "show",
        populate: {
          path: "theatre",
          model: "theatres",
        },
      })
      .session(session);

    await session.commitTransaction();
    session.endSession();
    res.send({
      success: true,
      message: "Bookings fetched!",
      data: bookings,
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

const makePaymentAndBookShow = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let paymentIntent;
  try {
    const { token, amount, show: showId, seats } = req.body;

    // step: 1: check if the customer already exist in stripe
    const customers = await stripe.customers.list({
      email: token.email,
      limit: 1,
    });

    let currCustomer;
    if (customers.data.length > 0) {
      currCustomer = customers.data[0];
    } else {
      currCustomer = await stripe.customers.create({
        email: token.email,
        source: token.id,
      });
    }

    // step 2: create the payment intent using the customer
    paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "usd",
      customer: currCustomer.id, // Use the existing or newly created customer ID
      payment_method_types: ["card"],
      receipt_email: token.email,
      description: "Payment for movie booking!",
    });

    const transactionId = paymentIntent.id;

    // step 3: booking the show if payment is successfu
    const show = await Show.findById(showId).populate("movie").session(session);
    const seatAlreadyBooked = seats.some((seat) =>
      show.bookedSeats.includes(seat)
    );
    if (seatAlreadyBooked) {
      throw new Error("One or more seats are already booked.");
    }

    const updatedBookedSeats = [...show.bookedSeats, ...req.body.seats];
    await Show.findByIdAndUpdate(req.body.show, {
      bookedSeats: updatedBookedSeats,
    });
    const newBooking = new Booking({
      ...req.body,
      transactionId,
    });

    await newBooking.save({ session });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate("user")
      .populate("show")
      .populate({
        path: "show",
        populate: { path: "movie", model: "movies" },
      })
      .populate({
        path: "show",
        populate: { path: "theatre", model: "theatres" },
      })
      .session(session);

    await session.commitTransaction();
    session.endSession();

    res.send({
      success: true,
      message: "Payment and Booking successful!",
      data: populatedBooking,
    });

    const { DateTime } = require("luxon");
    const formattedDate = DateTime.fromJSDate(populatedBooking.show.date).toFormat("yyyy LLL dd");
    await EmailHelper("ticketTemplate.html", populatedBooking.user.email, {
      name: populatedBooking.user.name,
      movie: populatedBooking.show.movie.movieName,
      theatre: populatedBooking.show.theatre.name,
      date: formattedDate,
      time: populatedBooking.show.time,
      seats: populatedBooking.seats,
      amount: populatedBooking.seats.length * populatedBooking.show.ticketPrice,
      transactionId: populatedBooking.transactionId,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    if (err.message.includes("One or more seats are already booked.")) {
      // start the refund process;
      // await stripe.refunds.create({ payment_intent: paymentIntent.id });
    }
    res.send({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  makePayment,
  bookShow,
  getAllBookings,
  makePaymentAndBookShow,
};
