// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      statusCode: 'E10000',
      message: 'An unexpected error occurred',
      data: null
    });
  };
  
  module.exports = errorHandler;
  