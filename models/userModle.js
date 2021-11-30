const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto')
const validateEmail = function(email) {
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return re.test(email)
};

const userSchema = new mongoose.Schema(
  {
    name : {
      type : String,
      required : [true ,'Please add your name']
    },

    photo :String,

    role: {
      type: String,
      default: "user",
      enum: ["user", "guide", "lead-guide", "admin"]
    },

    email : {
      type : String,
      required : [true , 'Please add your email'],
      unique : true,
      lowercase : true ,
      validate: [validateEmail, 'Please fill a valid email address'],
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address']
    },
    password : {
      type : String ,
      minlength : 8 ,
      required : [true , 'Please add your password'] ,
      select : false
    },
    confirmPassword:{
      type: String,
      required: [true, 'Please confirm your password'],
      validate: {
        // This only works on CREATE and SAVE!!!
        validator: function(el) {
          return el === this.password;
        },
        message: 'Passwords are not the same!'
      }
    },
    passwordChangedAt: Date,
    passwordResetToken : String,
    passwordResetExpires : Date,
    active :{
      type : Boolean,
      select : false,
      default : true
    }

  }
)
// make encryption that make a password is change when save in password but it is the same
// 12 is the number of new password
userSchema.pre('save', async function(next){
  if(!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password ,12);
  this.confirmPassword = undefined
  next()
});

userSchema.pre('save', function(next) {
  if (!this.isModified('password') || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
// to dont show un active(delate user)
userSchema.pre(/^find/, function(next) {
  // this points to the current query
  this.find({ active: { $ne: false } });
  next();
});


userSchema.methods.correctPassword = async function(candidatePassword , password){
   return await bcrypt.compare(candidatePassword ,password);
}

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimestamp < changedTimestamp;
  }
  // False means NOT changed
  return false;
};


userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};


const  User = mongoose.model('User',userSchema);
module.exports = User
