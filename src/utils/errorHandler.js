const handleError = (res, error) => {
    const { statusCode = 500, message } = error;
    res.status(statusCode).json({ success: false, message });
  };

  module.exports = { handleError };