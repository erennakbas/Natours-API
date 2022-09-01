/* eslint-disable node/no-unsupported-features/es-syntax */

const Tour = require('../models/tourModel');
const ApiFeatures = require('../utils/apiFeature');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.top5ToursAlias = (req, res, next) => {
  req.query.limit = 5;
  req.query.sort = '-averageRatings,price';
  req.query.fields = 'name,price,averageRatings,summary,difficulty';
  next();
};
exports.getAllTours = catchAsync(async (req, res) => {
  const queryObj = req.query;
  const query = Tour.find();
  const apiFeatures = ApiFeatures(query, queryObj);
  const page = queryObj.page || 1;
  const limit = queryObj.limit || 100;
  const skip = (page - 1) * limit;
  apiFeatures
    .skipAndLimit(skip, limit)
    .sort()
    .selectFields();

  const tours = await query;

  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours
    }
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const query = Tour.findById(req.params.id);
  const apiFeatures = ApiFeatures(query, req.query);
  apiFeatures.selectFields();
  const tour = await query;
  if (!tour) {
    return next(
      new AppError(
        `Tour is not found with id : ${req.params.id}`,
        404,
        'Not Found Error'
      )
    );
  }
  res.status(200).json({
    status: 'success',
    tour
  });
});

exports.createTour = catchAsync(async (req, res) => {
  const newTour = await Tour.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const newTour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidator: true
  });
  if (!newTour) {
    return next(
      new AppError(
        `Tour is not found with id : ${req.params.id}`,
        404,
        'Not Found Error'
      )
    );
  }
  res.status(201).json({
    status: 'success',
    data: {
      tour: newTour
    }
  });
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  const oldTour = await Tour.findByIdAndDelete(req.params.id);
  if (!oldTour) {
    return next(
      new AppError(
        `Tour is not found with id : ${req.params.id}`,
        404,
        'Not Found Error'
      )
    );
  }
  res.status(202).json({
    status: 'Deletion is successful',
    data: {
      tour: oldTour
    }
  });
});
exports.getTourStats = catchAsync(async (req, res) => {
  const stats = await Tour.aggregate([
    {
      $match: {
        averageRatings: { $gte: 3.0 }
      }
    },
    {
      $group: {
        _id: { $toUpper: '$difficulty' },
        totalTourCount: { $sum: 1 },
        totalRatingQuantity: { $sum: '$ratingsQuantity' },
        avgRatings: { $avg: '$averageRatings' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: { avgPrice: 1 }
    }
  ]);
  res.status(201).json({
    status: 'success',
    data: {
      stats: stats
    }
  });
});
exports.getMonthlyPlan = catchAsync(async (req, res) => {
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  const { year } = req.params;
  const monthlyPlans = await Tour.aggregate([
    {
      $unwind: '$startDates'
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`)
        }
      }
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numberOfTours: { $sum: 1 },
        tours: { $push: '$name' }
      }
    },
    {
      $addFields: {
        month: '$_id'
      }
    },
    {
      $project: {
        _id: 0
      }
    },
    {
      $sort: {
        numberOfTours: -1
      }
    }
  ]);
  monthlyPlans.forEach(plan => {
    plan.month = months[plan.month - 1];
  });
  res.status(201).json({
    status: 'success',
    data: {
      plans: monthlyPlans
    }
  });
});
