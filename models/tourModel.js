const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'],
      unique: true,
      trim: true,
      maxLength: [45, "A tour's name length must be less than or equal 45"],
      minLength: [10, "A tour's name length must be bigger than or equal 10"]
      // validate: [validator.isAlpha, "A tour's name must only contain alphabetic characters"]
    },
    slug: {
      type: String
    },
    averageRatings: {
      type: Number,
      default: 4.5,
      max: [5.0, "Rating's average must be less than or equal 5.0"],
      min: [1.0, "Rating's average must be bigger than or equal 1.0"]
    },
    ratingsQuantity: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price']
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration']
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maxiumum group size']
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty must be easy, medium or difficult'
      }
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function(val) {
          return val < this.price;
        },
        message: "Price discount can't be bigger than price"
      }
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary']
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover']
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);
tourSchema.pre('save', function(next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});
tourSchema.pre(/^find/, function(next) {
  this.find({ secretTour: false });
  next();
});
tourSchema.pre('aggregate', function(next) {
  this.pipeline().unshift({ $match: { secretTour: false } });
  next();
});
tourSchema.virtual('durationWeeks').get(function() {
  return this.duration / 7;
});
module.exports = mongoose.model('Tour', tourSchema);
