import { HttpError } from 'http-errors';

const errorHandler = (err, req, res, next) => {
  console.log('Error middleware', err);

  if (err instanceof HttpError) {
    return res.status(err.status).json({
      message: err.message || err.name,
    });
  }

  const isProd = process.env.NODE_ENV === 'production';

  return res.status(500).json({
    message: isProd ? 'Something went wrong. Please try again' : err.message,
  });
};

export { errorHandler };
