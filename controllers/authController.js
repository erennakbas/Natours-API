const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const createAndSendToken = require('../utils/createAndSendToken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.checkJWT = catchAsync(async (req, res, next) => {
  let token;
  // eslint-disable-next-line prettier/prettier
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  )
    token = req.headers.authorization.split(' ')[1];
  if (!token) {
    return next(
      new AppError(
        'You are not logged in. Please login to get access',
        401,
        'UnauthorizedError'
      )
    );
  }
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // if user is deleted
  const user = await User.findById(decoded.id);
  if (!user) {
    return next(
      new AppError(
        "The user issued with this token doesn't exist",
        401,
        'UserDoesNotExistError'
      )
    );
  }
  //if user has changed his password after token is issued
  if (user.isPasswordChanged(new Date(decoded.iat * 1000 + 1500))) {
    return next(
      new AppError(
        'The user changed his/her password, token is no longer usable, please login again',
        401,
        'UserChangedPasswordError'
      )
    );
  }
  //grant access
  req.user = user;
  next();
});

exports.getSafeFields = (req, res, next) => {
  //role ve passwordCreatedAt silinecek.
  // eslint-disable-next-line prettier/prettier
  const {
    name,
    email,
    password,
    passwordConfirm,
    role,
    passwordChangedAt
  } = req.body;
  req.body = {
    name,
    email,
    password,
    passwordConfirm,
    role,
    passwordChangedAt
  };
  next();
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);

  createAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  let isCorrect;
  const { email, password } = req.body;
  if (!email || !password) {
    return next(
      new AppError(
        'Please provide email and password',
        404,
        'AuthenticationError'
      )
    );
  }
  const user = await User.findOne({ email }).select('+password');
  if (user) {
    isCorrect = await user.isCorrectPassword(password, user.password);
  }
  if (user && !isCorrect) {
    user.failedAttempts += 1;
    if (user.failedAttempts >= 10 || user.isBlocked()) {
      user.blockedTill = Date.now() + 36000000;
      if (user.failedAttempts === 25) {
        user.active = false;
      }
      user.save({ validateBeforeSave: false });
      return next(
        new AppError(
          `Your account is blocked for 1 hour because of 10 failed login attempts,
          You have to wait or reset your password, 
          If you try to login and fail your block duration will be renewed, 
          If you exceed 25 failed login attempts then your account will be suspended.`,
          401,
          'AccountBlockedError'
        )
      );
    }
    user.save({ validateBeforeSave: false });
  }

  if (!user || !isCorrect) {
    return next(
      new AppError(
        'Incorrect email or password',
        401,
        'InvalidCredentialsError'
      )
    );
  }
  // if it was blocked, reset it.
  if (user.blockedTill) {
    user.failedAttempts = 0;
    user.blockedTill = undefined;
    user.save({ validateBeforeSave: false });
  }
  createAndSendToken(user, 200, res);
});
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You have no permission to do this action',
          403,
          'ForbiddenError'
        )
      );
    }
    next();
  };
};
