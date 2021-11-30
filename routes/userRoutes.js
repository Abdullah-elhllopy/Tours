const express = require("express");
const userController = require('../controllers/userControler');
const authController = require('../controllers/authController');

const userRouter = express.Router();

userRouter.post('/signup' , authController.signUp);
userRouter.post('/login' , authController.login);
userRouter.post('/forgotPassword' , authController.forgotPassword);
userRouter.patch('/resetPassword/:token', authController.resetPassword);
userRouter.patch('/updateMyPassword', authController.protected,authController.updatePassword);
userRouter.patch('/updateMe', authController.protected,userController.updateMe);
userRouter.delete('/deleteMe', authController.protected, userController.deleteMe);

userRouter.route("/" )
.get(userController.getAllUsers)
.post(userController.addUser);

userRouter.route("/:id" )
.patch(userController.updateUser)
.get(userController.getUser)
.delete(userController.deleteUser)

module.exports = userRouter