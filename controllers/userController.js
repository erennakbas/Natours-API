const crypto = require('crypto');
const User = require('../models/userModel');
const ApiFeatures = require('../utils/apiFeature');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const sendEmail = require('../utils/sendEmail');
const createAndSendToken = require('../utils/createAndSendToken');

exports.getAllUsers = catchAsync(async (req, res) => {
  const queryObj = req.query;
  const query = User.find();
  const apiFeatures = ApiFeatures(query, queryObj);
  const page = queryObj.page || 1;
  const limit = queryObj.limit || 100;
  const skip = (page - 1) * limit;
  apiFeatures
    .skipAndLimit(skip, limit)
    .sort()
    .selectFields();

  const users = await query;

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});
exports.updateMyself = catchAsync(async (req, res, next) => {
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use the /update-my-password route.'
      ),
      400,
      'BadRequestError'
    );
  }
  const { email, name } = req.body;
  const user = await User.findOne({ _id: req.user.id });
  user.email = email;
  user.name = name;
  await user.save({ validateModifiedOnly: true });
  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});
exports.deleteMyself = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });
  res.status(204).json({
    status: 'success',
    data: null
  });
});
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined!'
  });
};
exports.deleteUser = catchAsync(async (req, res, next) => {
  const oldUser = await User.findByIdAndDelete(req.params.id);
  if (!oldUser) {
    return next(
      new AppError(
        `User is not found with id : ${req.params.id}`,
        404,
        'NotFoundError'
      )
    );
  }
  res.status(202).json({
    status: 'success',
    data: {
      user: oldUser
    }
  });
});
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(
      new AppError(
        `User is not found with that email : ${req.body.email}`,
        404,
        'NotFoundError'
      )
    );
  }
  const resetToken = user.createPasswordResetToken();
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/reset-password/${resetToken}`;
  const message = `Forgot your password? If so please send a PATCH request to this url ${resetURL} with password and passwordConfirm fields.\n If not just ignore this email.`;
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 minutes).',
      message
    });
    await user.save({ validateModifiedOnly: true });
    res.status(202).json({
      status: 'success',
      messsage: 'Token is sent to email'
    });
  } catch (err) {
    console.log(err);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateModifiedOnly: true });
    return next(
      new AppError(
        'There was an error sending the email, please try again later'
      ),
      500,
      'EmailError'
    );
  }
});
exports.resetPassword = catchAsync(async (req, res, next) => {
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');
  const user = await User.findOne({ passwordResetToken: hashedToken });
  if (req.body.password !== req.body.passwordConfirm) {
    return next(
      new AppError(
        'Password and password confirm fields are not the same',
        401,
        'ValidatorError'
      )
    );
  }
  if (!user) {
    return next(new AppError('Token is not valid', 401, 'TokenNotValidError'));
  }
  if (Date.now() > user.passwordResetExpires) {
    return next(new AppError('Token has expired', 401, 'TokenExpiredError'));
  }
  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.failedAttempts = 0;
  user.blockedTill = undefined;
  await user.save({ validateModifiedOnly: true });

  createAndSendToken(user, 200, res);
});
