const mongoose = require('mongoose');
//http should be converted to https.
const http = require('http');
const dotenv = require('dotenv');
const app = require('./app');

const port = process.env.PORT || 3000;
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose.connect(DB);
const server = http.createServer({}, app).listen(port, () => {
  console.log(`App running on port ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log(err.name, err.message);
  console.log('Shutting down...');
  server.close(() => {
    console.log('Closing the server...');
    process.exit(1);
  });
});
// process.on('unhandledException', err => {
//   console.log(err.name, err.message);
//   console.log('Shutting down...');
//   server.close(() => {
//     console.log('Closing the server...');
//     process.exit(1);
//   });
// });
