import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.ts';
import routes from './routes/index.ts';
import { connectDB } from './config/db.ts';

const app = express();

// Allow the React app (another port) to call this API from the browser.
app.use(cors());
// Turn JSON text from the client into req.body.
app.use(express.json());
app.use('/api', routes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const start = async (): Promise<void> => {
  try {
    if (process.env.MONGO_URI) {
      await connectDB();
    } else {
      console.warn('MONGO_URI is empty. Health route works; database routes will wait.');
    }

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
};

void start();

export default app;
