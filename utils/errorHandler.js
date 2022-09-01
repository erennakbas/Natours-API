const AppError = require('./appError');

const handleCastError = err => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400, 'CastError');
};
const handleJWTError = err => {
  const message = 'Invalid token. Please login again';
  return new AppError(message, 401, 'JsonWebTokenError');
};
const handleDuplicateError = err => {
  // eslint-disable-next-line prettier/prettier
  const message = `Duplicate name field: ${err.keyValue.name}. Please use another value.`;
  return new AppError(message, 400, 'DuplicateFieldError');
};
const handleValidatorError = err => {
  const messages = Object.values(err.errors).map(el => el.message);
  return new AppError(messages.join('. '), 400, 'ValidationError');
};

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      error: err.error,
      message: err.message
    });
  } else {
    res.status(500).json({
      status: err.status,
      error: err.error,
      message: 'Something went wrong'
    });
  }
};
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    error: err,
    status: err.status,
    message: err.message,
    stack: err.stack
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let newError;
    if (err.name === 'CastError') newError = handleCastError(err);
    else if (err.code === 11000) newError = handleDuplicateError(err);
    // eslint-disable-next-line prettier/prettier
    else if (err.name === 'ValidatorError')
      newError = handleValidatorError(err);
    else if (err.name === 'JsonWebTokenError') newError = handleJWTError(err);
    sendErrorProd(newError || err, res);
  }

  next();
};
