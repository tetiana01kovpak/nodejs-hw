//Imports
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { logger } from './middleware/logger.js';
import { notFoundHandler } from './middleware/notFoundHandler.js';
import { errorHandler } from './middleware/errorHandler.js';
import notesRouters from './routes/notesRoutes.js';
import { connectMongoDB } from './db/connectMongoDB.js';

const app = express();
const PORT = process.env.PORT ?? 3000;

//MIddleware - Pino(pretty) logging
app.use(logger);

//Middleware - JSON parsing
app.use(express.json());

//Middleware - CORS
app.use(cors());

//Routes - Notes
app.use(notesRouters);

//Middleware - 404 - Route not found
app.use(notFoundHandler);

//Middleware - Error catching
app.use(errorHandler);

//DB connection
await connectMongoDB();

//Start server
app.listen(PORT, (error) => {
  if (error) {
    console.log('Error:', error);
  } else {
    console.log(`Server is running on port ${PORT}`);
  }
});
