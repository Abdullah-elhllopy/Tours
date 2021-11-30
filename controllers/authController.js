const User = require('./../models/userModle');
const catchAsync = require('../utils/catchAsync')
const jwt = require('jsonwebtoken');
const AppError = require('./../utils/appError')
const sendEmail = require('./../utils/email');
const {promisify} = require('util');
const crypto = require('crypto');


// this method return jwt token string for me by using jsonwebtoken lib jwt is just a string i used it in login and sign in security
const signToken = id =>{
   return jwt.sign({id } , process.env.JWT_SECRET ,{
      expiresIn: process.env.JWT_EXPIRES_IN
   })
}

const createSendToken = (user, statusCode, res) => {
   const token = signToken(user._id);

   // i wanted to send cookies to browser , expires option will make the client delete the cookie after the time expires
   // secure true for https , httponly to prevent client to modify cookies

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true
  };
  //if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;

  return res
    .cookie("access_token", token, {
      expires: new Date(
        Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production'? true: false
    }).status(statusCode).json({
     status: 'success',
     token,
     data: {
       user
     }
   });
 };



// sing up
exports.signUp = catchAsync( async(req ,res ,next)=>{
   // i take new user in this way instead of req.body to prevent any one to hack i take a special information
   const newUser = await User.create({
      name :req.body.name,
      email : req.body.email,
      password : req.body.password,
      confirmPassword : req.body.confirmPassword,
      role : req.body.role
   });
   createSendToken(newUser,201,res);
})


// login
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2) Check if user exists && password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) If everything ok, send token to client
  createSendToken(user, 200, res);
});

// Protectd Routes
exports.protected = catchAsync(async (req,res,next)=>{
   // getting token and check of it is there
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
   if(!token){
      next(new AppError('you arent login ! Please login first....'))
   }

   //Verification Token
   const decoded = await promisify(jwt.verify)(token , process.env.JWT_SECRET);

   // check if user still exist (متمسخش)

   const currentUser = await User.findById(decoded.id);
   if(!currentUser){
      return next(new AppError('the user belong to this token doesnt exist',401))
   }

   // 4) Check if user changed password after the token was issued
   if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('User recently changed password! Please log in again.', 401)
      );
   }

    // GRANT ACCESS TO PROTECTED ROUTE
   req.user = currentUser;
   next();
})

// we need midleware function but we need to pass state of user as a varible so we use wrapper function that return middleware function
exports.restrictTo = (...roles) => {
   return (req, res, next) => {
     // roles ['admin', 'lead-guide']. role='user'
     // while roles dont contain req.user.role send error
     if (!roles.includes(req.user.role)) {
       return next(
         new AppError('You do not have permission to perform this action', 403)
       );
     }

     next();
   };
 };


 exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address.', 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false});

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message
    });
   res.status(200).json({ success: true, data:'Email sent' });

  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Email could not be sent',500));
  }
});


exports.resetPassword = catchAsync(async (req, res, next) => {
   // 1) Get user based on the token
   // req.params.token because url is /:token
   const hashedToken = crypto
     .createHash('sha256')
     .update(req.params.token)
     .digest('hex');

   const user = await User.findOne({
     passwordResetToken: hashedToken,
     passwordResetExpires: { $gt: Date.now() }
   });

   // 2) If token has not expired, and there is user, set the new password
   if (!user) {
     return next(new AppError('Token is invalid or has expired', 400));
   }
   user.password = req.body.password;
   user.confirmPassword = req.body.confirmPassword;
   user.passwordResetToken = undefined;
   user.passwordResetExpires = undefined;
   // for passwordChangedAt
   await user.save();
   // 3) Update changedPasswordAt property for the user
   // 4) Log the user in, send JWT
   createSendToken(user,200,res);

 });

 exports.updatePassword = catchAsync(async (req, res, next) => {
   // 1) Get user from collection
   const user = await User.findById(req.user.id).select('+password');
   console.log(user)
   // 2) Check if POSTed current password is correct
   if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
     return next(new AppError('Your current password is wrong.', 401));
   }

   // 3) If so, update password
   user.password = req.body.password;
   user.confirmPassword = req.body.confirmPassword;
   await user.save();
   // User.findByIdAndUpdate will NOT work as intended!

   // 4) Log user in, send JWT
   const token = signToken(user._id);
   res.status(200).json({
     status: 'success',
     token,
     data: {
       user
     }
   });
 });








