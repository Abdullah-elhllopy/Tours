const catchAsync = require('../utils/catchAsync');
const Review = require('../models/reviewModle');

exports.getAllReviews = catchAsync( async (req , res ,next)=>{
  const Reviews = await Review.find();

  res.status(200).json({
    status : "success",
    results : Reviews.length,
    data :{
      Reviews
    }
  })
})
exports.createReview = catchAsync( async (req ,res ,next)=>{
  const newReview =  await Review.create(req.body)
  res.status(201).json({
    status : 'success',
    data : {
      Review : newReview
    }
  })
})

