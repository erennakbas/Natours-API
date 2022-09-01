const express = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./utils/errorHandler');

dotenv.config({ path: './config.env' });
const app = express();

//Set Security HTTP Headers
app.use(helmet());

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  //Use logger
  app.use(morgan('dev'));
}

//Use body parser, for reading req.body
//Limit for request size.
app.use(express.json({ limit: '10kb' }));

//Data sanitization for noSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent http parameter pollution
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

//Serving static folder for frontend
app.use(express.static('/public'));

//Limit requests from a certain IP

const limiter = rateLimit({
  max: 100,
  windowMs: 36000000,
  message: 'Too many request came from this IP, you are blocked for 1 hour.'
});

app.use('/api', limiter);

//Test
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// 3) ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
// Handler for non implemented urls.
app.all('*', (req, res, next) => {
  return next(
    new AppError(
      `Cannot find ${req.originalUrl} url on this server. `,
      404,
      'URLNotFoundError'
    )
  );
});

//Error handler
app.use(globalErrorHandler);

module.exports = app;
