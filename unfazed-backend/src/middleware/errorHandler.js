// Central error handler - keeps controllers clean
const errorHandler = (err, req, res, next) => {
  console.error(err);
  if (err.code === 11000) {
    return res.status(409).json({ message: 'That value is already in use' });
  }
  res.status(err.status || 500).json({ message: err.message || 'Something went wrong' });
};

module.exports = errorHandler;
