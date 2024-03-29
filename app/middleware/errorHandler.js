import { ReasonPhrases, StatusCodes } from "http-status-codes";

/*
  Catch Errors Handler

  With async/await, you need some way to catch errors
  Instead of using try{} catch(e) {} in each controller, we wrap the function in
  catchErrors(), catch any errors they throw, and pass it along to our express middleware with next()
*/

export const catchErrors = (fn) => {
  return function (req, res, next) {
    const resp = fn(req, res, next);
    if (resp instanceof Promise) {
      return resp.catch(next);
    }
    return resp;
  };
};

/*
    Not Found Error Handler
    If we hit a route that is not found, we mark it as 404 and pass it along to the next error handler to display
  */
export const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
  res.redirect("back");
};

/*
    MongoDB Validation Error Handler
    Detect if there are mongodb validation errors that we can nicely show via flash messages
  */

export const flashValidationErrors = (err, req, res, next) => {
  if (!err.errors) return next(err);

  // validation errors look like
  const errorKeys = Object.keys(err.errors);
  errorKeys.forEach((key) => {
    res.status(StatusCodes.UNPROCESSABLE_ENTITY).json({
      status: ReasonPhrases.UNPROCESSABLE_ENTITY,
      error: err.errors[key].message,
    });
  });
};

/*
    Development Error Handler
    In development we show good error messages so if we hit a syntax error or any other previously un-handled error, we can show good info on what happened
  */
export class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const developmentErrors = (err, req, res, next) => {
  err.stack = err.stack || "";
  const errorDetails = {
    message: err.message,
    status: err.status,
    stackHighlighted: err.stack.replace(
      /[a-z_-\d]+.js:\d+:\d+/gi,
      "<mark>$&</mark>"
    ),
  };
  res.status(err.status || 500);
  res.format({
    // Based on the `Accept` http header
    "text/html": () => {
      res.send({
        error: errorDetails,
      });
    }, // Form Submit, Reload the page
    "application/json": () => res.json(errorDetails), // Ajax call, send JSON back
  });
  next();
};

/*
    Production Error Handler
    No stacktraces are leaked to admin
  */
export const productionErrors = (err, req, res, next) => {
  res.status(500).json({
    error: err,
  });
  next();
};
