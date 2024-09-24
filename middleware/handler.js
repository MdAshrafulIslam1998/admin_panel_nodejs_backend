// utils/responseHandler.js
module.exports = {
  SUCCESS: (res, code, message, data) => {
    return res.status(200).json({
      responseCode: code,
      responseMessage: message,
      data: data || null,
    });
  },

  ERROR: (res, code, message, error = null) => {
    return res.status(500).json({
      responseCode: code,
      responseMessage: message,
      error: error || 'Something went wrong',
    });
  }
};
