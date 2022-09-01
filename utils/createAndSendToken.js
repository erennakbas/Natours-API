const signToken = require('./signToken');

module.exports = (user, statusCode, res) => {
  const token = signToken(user._id);
  user.password = undefined;
  user.active = undefined;
  const cookieOptions = {
    httpOnly: true,
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
    )
  };
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};
