import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './lib/swagger';
import { errorHandler } from './middlewares/error.middleware';
import router from './routes';

const app = express();

app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://coreahoyfe.vercel.app',
      'https://www.coreahoyfe.vercel.app',
    ],
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());

app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    swaggerOptions: {
      defaultModelsExpandDepth: -1,
    },
  }),
);

app.use('/api', router);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use(errorHandler);

export default app;
