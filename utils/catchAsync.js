module.exports = fn => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
// catch pass the error to the next middleware function
// this code run global middleware function in app.js