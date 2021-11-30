const express = require("express");
const toursController = require('../controllers/tourController');
const authController = require('../controllers/authController');

const tourRouter = express.Router();

tourRouter.route("/tour-stats").get(toursController.getTourStats)

tourRouter.route("/top-5-cheap").get(toursController.alisTopTours ,toursController.getAllTours)
tourRouter.route("/get-monthly-plan/:year").get(toursController.getMonthlyPlan);

//tourRouter.param('id',toursController.checkID)
tourRouter.route("/" )
.get(authController.protected, toursController.getAllTours)
.post( toursController.addTour);


tourRouter.route("/:id" )
.patch(toursController.updateTour)
.get(toursController.getTour)
.delete(
    authController.protected,
    authController.restrictTo('admin', 'lead-guide'),
    toursController.delateTour
  );

module.exports = tourRouter;
