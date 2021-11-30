/* ====== create node.js server with express.js framework ====== */
// dependencies
const express = require("express");
const morgan = require('morgan')
const tourRouter  = require('./routes/tourRoutes');
const reviewRouter  = require('./routes/reviewRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require("express-rate-limit");
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');


const app = express();
// 1) GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ***** Security *****

// Limit requests from same API to make limit of request
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!'
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// remove duplicate words in query
// Prevent parameter pollution , write expected duplicate words
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price'
    ]
  })
);


//test middleware
app.use((req,res,next)=>{
   req.requestTime = new Date().toISOString();
   console.log(req.requestTime)
   next()
})

//2) ROUTES FUNCHIONS
//3) ROUTES
app.use('/api/v1/tours',tourRouter)
app.use('/api/v1/users',userRouter)
app.use('/api/v1/reviews',reviewRouter);

app.all('*',(req,res,next)=>{
  next(new AppError(`Cant find ${req.originalUrl} on this server! `,404))
})
// when say next(appError) you mean running this function
app.use(globalErrorHandler)

// 4) START SERVER
module.exports = app
