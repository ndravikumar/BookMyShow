const Booking = require("../models/bookingSchema");
const Show = require("../models/showSchema");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_KEY);
const EmailHelper = require("../utils/emailHelper");
const { DateTime } = require("luxon");

// ✅ makePayment (fixed currCustomer issue)
const makePayment = async (req, res) => {
  try {
    const { token, amount } = req.body;

    const customers = await stripe.customers.list({
      email: token.email,
      limit: 1,
    });

    let currCustomer; // ✅ changed from const to let
    if (customers.data.length > 0) {
      currCustomer = customers.data[0];
    } else {
      currCustomer = await stripe.customers.create({
        source: token.id,
        email: token.email,
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: currCustomer.id,
      payment_method_types: ["card"],
      receipt_email: token.email,
      description: "Token assigned to the movie",
    });

    res.send({
      success: true,
      message: "Payment Successful! Tickets Booked",
      data: paymentIntent.id,
    });
  } catch (error) {
    res.send({
      success: false,
      message: error.message,
    });
  }
};

// ✅ bookShow function cleaned
const bookShow = async (req, res) => {
  try {
    const { show: showId, seats } = req.body;

    const show = await Show.findById(showId).populate("movie");
    const seatAlreadyBooked = seats.some((seat) =>
      show.bookedSeats.includes(seat)
    );

    if (seatAlreadyBooked) {
      return res.status(409).send({
        success: false,
        message: "One or more seats are already booked.",
      });
    }

    const newBooking = new Booking(req.body);
    await newBooking.save();

    await Show.findByIdAndUpdate(showId, {
      bookedSeats: [...show.bookedSeats, ...seats],
    });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate("user")
      .populate({
        path: "show",
        populate: [
          { path: "movie", model: "movies" },
          { path: "theatre", model: "theatres" },
        ],
      });

    const formattedDate = DateTime.fromJSDate(
      populatedBooking.show.date
    ).toFormat("yyyy LLL dd");

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
      message: "New booking done!",
      data: newBooking,
    });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
};

// ✅ getAllBookings fixed populate model name
const getAllBookings = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    const bookings = await Booking.find({ user: req.body.userId })
      .populate("user")
      .populate({
        path: "show",
        populate: [
          { path: "movie", model: "movies" },
          { path: "theatre", model: "theatres" },
        ],
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
    const { token, amount, show: showId, seats, ...rest } = req.body;

    // step 1: Find/Create customer
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

    // step 2: Create Payment Intent
    paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      customer: currCustomer.id,
      payment_method_types: ["card"],
      receipt_email: token.email,
      description: "Payment for movie booking!",
    });

    const transactionId = paymentIntent.id;

    // step 3: Check booking logic
    const show = await Show.findById(showId).populate("movie").session(session);

    const seatAlreadyBooked = seats.some((seat) =>
      show.bookedSeats.includes(seat)
    );
    if (seatAlreadyBooked)
      throw new Error("One or more seats are already booked.");

    // update show seats
    await Show.findByIdAndUpdate(showId, {
      bookedSeats: [...show.bookedSeats, ...seats],
    }).session(session);

    // save booking
    const newBooking = new Booking({
      ...rest,
      show: showId,
      seats,
      transactionId,
    });
    await newBooking.save({ session });

    const populatedBooking = await Booking.findById(newBooking._id)
      .populate("user")
      .populate({
        path: "show",
        populate: [
          { path: "movie", model: "movies" },
          { path: "theatre", model: "theatres" },
        ],
      })
      .session(session);

    await session.commitTransaction();
    session.endSession();

    // ✅ SEND RESPONSE FIRST
    res.status(200).json({
      success: true,
      message: "Payment and Booking successful!",
      data: populatedBooking,
    });

    // ✅ FIRE EMAIL ASYNC (no await)
    const { DateTime } = require("luxon");
    const formattedDate = DateTime.fromJSDate(
      populatedBooking.show.date
    ).toFormat("yyyy LLL dd");

    EmailHelper("ticketTemplate.html", populatedBooking.user.email, {
      name: populatedBooking.user.name,
      movie: populatedBooking.show.movie.movieName,
      theatre: populatedBooking.show.theatre.name,
      date: formattedDate,
      time: populatedBooking.show.time,
      seats: populatedBooking.seats,
      amount: populatedBooking.seats.length * populatedBooking.show.ticketPrice,
      transactionId,
    }).catch((err) => console.error("Email failed:", err));
  } catch (error) {
    session.endSession();

    if (
      paymentIntent &&
      error.message.includes("One or more seats are already booked.")
    ) {
      // Optionally refund
      // await stripe.refunds.create({ payment_intent: paymentIntent.id });
    }

    // ✅ Only send error response once
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    } else {
      console.error("Tried to send response again:", error);
    }
  }
};

module.exports = {
  makePayment,
  bookShow,
  getAllBookings,
  makePaymentAndBookShow,
};
