import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import authRoutes from './routes/auth.routes.js';
import quizRoutes from './routes/quiz.routes.js';
import scoreRoutes from './routes/score.routes.js';
import leaderboardRoutes from './routes/leaderboard.routes.js';
import adminQuestionRoutes from './routes/adminQuestion.routes.js';

import { errorHandler, notFound } from './middleware/error.middleware.js';
import { env } from './config/env.js';

const app = express();

app.use(helmet());

app.use(
    cors({
        origin: env.clientUrl || 'http://localhost:5173',
        credentials: true
    })
);

app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        data: { status: 'ok' }
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/admin/questions', adminQuestionRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;