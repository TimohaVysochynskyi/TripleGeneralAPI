import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pino from 'pino-http';

import { env } from './utils/env.js';
import { testConnection } from './database/connection.js';
import { apiRateLimit } from './middlewares/rateLimits.js';
import { sanitizeInput, preventInjection } from './middlewares/sanitize.js';

import router from './routers/index.js';

import { notFoundHandler } from './middlewares/notFoundHandler.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const setupServer = async () => {
  const PORT = Number(env('PORT', '3000'));

  // Test database connection (non-blocking)
  await testConnection();

  const app = express();

  // CORS must be first to handle preflight requests
  // app.use(
  //   cors({
  //     origin: env('CLIENT_DOMAIN'),
  //     credentials: true,
  //   }),
  // );

  // Security headers
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(express.json({ limit: '10mb' }));

  // Apply global rate limiting
  app.use(apiRateLimit);

  // Apply input sanitization and injection prevention
  app.use(sanitizeInput);
  app.use(preventInjection);

  app.use(pino({ transport: { target: 'pino-pretty' } }));

  app.use('/api/', router);

  app.use(notFoundHandler);

  app.use(errorHandler);

  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
};
