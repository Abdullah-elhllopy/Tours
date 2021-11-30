const Tour = require('../models/tourModle')
const APIFeatures = require('../utils/apiFeatures')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')

exports.alisTopTours = (req,res ,next)=>{
   req.query.limit = '-5'
   req.query.sort = 'ratingsAverage,price'
   req.query.fields = 'name,price,ratingsAverage'
   next()
}

exports.getAllTours = catchAsync( async (req , res ,next)=>{

      const features = new APIFeatures(Tour.find() , req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate()

      const tours = await features.query;

      res.status(200).json({
          status : "success",
          results : tours.length,
          data :{
             tours
         }
       })

 })

 exports.getTour = catchAsync( async (req , res ,next)=>{

      const tour =  await Tour.findById(req.params.id).populate('reviews');
      // if there is no tour
      if(!tour){
        // next to run global middleware function
        return next(new AppError('No Tour Found With This ID ' ,404))
      }

      res.status(200).json({
         status : "success",
        data :{
            tour
         }
      })
 })

 exports.updateTour = catchAsync( async (req , res ,next)=>{

      const newTour =  await Tour.findByIdAndUpdate(req.params.id , req.body , {
         new : true ,
         runValidators : true
      })

   // if there is no tour
   if(!newTour){
       // next to run global middleware function
       return next(new AppError('No Tour Found With This ID ' ,404))
     }
       res.status(200).json({
          status : "success",
          data :{
             newTour
          }
       })
 })

 exports.delateTour =catchAsync( async (req , res, next)=>{

      const tour = await Tour.findByIdAndDelete(req.params.id);

      // if there is no tour
      if(!tour){
         // next to run global middleware function
         return next(new AppError('No Tour Found With This ID ' ,404))
       }
      res.status(204).json({
         status : "success",
         data :null
      })

 })

 exports.addTour = catchAsync( async (req ,res ,next)=>{

   const newTour =  await Tour.create(req.body)
   res.status(201).json({
      status : 'success',
      data : {
         tour : newTour
      }
      })
 })

 exports.getTourStats =catchAsync(  async (req,res)=>{

       //aggregate for filter data
         const stats = await Tour.aggregate([
            {
               $match : {ratingsAverage : {$gte : 4.5 } }
            },
            {
               $group : {
                  _id : '$difficulty',
                  numTours : {$sum : 1 },
                  numRating : {$sum : '$ratingsQuantity' },
                  avgRating : {$avg : '$ratingsAverage'},
                  avgPrice : {$avg : '$price'},
                  minPrice : {$min : '$price'},
                  maxPrice : {$max : '$price'}
               }
            }
         ])
         res.status(200).json({
            status : "success",
            data :{
               stats
            }
         })
 })


 exports.getMonthlyPlan =catchAsync(  async (req, res)=>{
      const year = req.params.year * 1 ;
      const plan = await Tour.aggregate([
        {
           $unwind : '$startDates'
        },
        {
           $match : {
            startDates : {
               $gte : new Date (`${year}-01-01`) ,
               $lte : new  Date (`${year}-12-01`)
            }
           }
        },
        {
         $group : {
            _id : {$month : '$startDates'},
            numTourStarts : { $sum : 1},
            tours : { $push : '$name'}
         }
      },{

         $addFields : {month : '$_id'}
      },
        {
        $project : { _id:0 }
      },
        {
          $sort : { numTourStarts: -1}
      },{
        $limit : 6
        }

      ])
      res.status(200).json({
         status : "success",
         results : plan.length,
         data :{
            plan
         }
      })
 })
