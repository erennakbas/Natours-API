/* eslint-disable prettier/prettier */
class AppError extends Error {
  constructor(message, statusCode, error) {
    super(message);
    this.statusCode = statusCode;
    // eslint-disable-next-line no-bitwise
    this.status = ~~(this.statusCode / 100) === 4 ? 'fail' : 'error';
    this.isOperational = true;
    this.error = error || 'InternalError';

  }
}

module.exports = AppError;