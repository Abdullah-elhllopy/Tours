const express = require("express");
const ReviewController = require('../controllers/reviewController');
const authController = require('../controllers/authController');
const reviewRouter = express.Router();

reviewRouter.route("/" )
  .get(authController.protected, ReviewController.getAllReviews)
  .post( ReviewController.createReview);

module.exports  = reviewRouter
