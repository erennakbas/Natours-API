const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  active: {
    type: Boolean,
    default: true,
    select: false
  },
  name: {
    type: String,
    required: [true, 'A user must have an name'],
    maxLength: [25, "A user's name length must be less than or equal 25"],
    minLength: [3, "A user's name length must be bigger than or equal 3"]
    // validate: [
    //   validator.isAlpha,
    //   "A user's name must only contain alphabetic characters"
    // ]
  },
  email: {
    type: String,
    required: [true, 'A user must have an email'],
    unique: [true, 'Email should be unique'],
    validate: [validator.isEmail, 'Non valid email']
  },
  password: {
    type: String,
    required: [true, 'A user must have a password'],
    // validate: [validator.isStrongPassword, 'Password should be strong']
    select: false
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Confirm your password'],
    validate: {
      //this works for only create() and save()
      validator: function(pass) {
        return pass === this.password;
      },
      message: 'Passwords are not the same'
    }
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'guide', 'lead-guide', 'admin'],
      message: 'Difficulty must be easy, medium or difficult'
    },
    default: 'user'
  },
  photo: {
    type: String,
    default: 'unknown.png'
  },
  slug: {
    type: String
  },
  failedAttempts: { type: Number, default: 0 },
  blockedTill: Date,
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date
});
userSchema.pre('save', async function(next) {
  if (this.isModified('name')) this.slug = slugify(this.name);
  //only run this function if the password is modified
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
    if (this.isNew) {
      this.passwordConfirm = undefined;
      return next();
    }
    this.passwordChangedAt = Date.now();
  }
  next();
});
userSchema.pre(/^find/, function(next) {
  this.find({ active: true });
  next();
});

userSchema.methods.isBlocked = function() {
  if (this.blockedTill)
    return Date.now().getTime() > this.blockedTill.getTime();
};
userSchema.methods.isCorrectPassword = async function(passwordAttempt) {
  return await bcrypt.compare(passwordAttempt, this.password);
};

userSchema.methods.isPasswordChanged = function(jwtIssuedAt) {
  if (this.passwordChangedAt) {
    return jwtIssuedAt.getTime() <= this.passwordChangedAt.getTime();
  }
  return false;
};

userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 600000;
  return resetToken;
};
module.exports = mongoose.model('User', userSchema);
