import { HttpError } from 'http-errors';

export const errorHandler = (error, req, res, next) => {
  // Log the error for debugging
  console.error('❌ Error:', error);

  if (error instanceof HttpError) {
    return res
      .status(error.status)
      .send({ status: error.status, message: error.message, data: error });
  }

  res
    .status(500)
    .send({
      status: 500,
      message: 'Something went wrong',
      data: {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
    });
};
