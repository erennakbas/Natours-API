const mongoose = require('mongoose');
const fs = require('fs');
const dotenv = require('dotenv');
const Tour = require('../../models/tourModel');
const app = require('../../app');

const port = process.env.PORT || 3000;
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose.connect(DB);

async function createTours() {
  const Tours = JSON.parse(fs.readFileSync('dev-data/data/tours.json'));
  await Tour.create(Tours);
  console.log('Tours created');
  process.exit();
}
async function deleteTours() {
  await Tour.deleteMany();
  console.log('Tours deleted');
  process.exit();
}
if (process.argv[2] === '--import') {
  createTours();
}
if (process.argv[2] === '--delete') {
  deleteTours();
}
