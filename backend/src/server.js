import app from './app.js';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';

async function start() {
    await connectDB();
    app.listen(env.port, '127.0.0.1', () => {
        console.log(`Server running on http://127.0.0.1:${env.port}`);
    });
}

start().catch((err) => {
    console.error('Failed to start server', err);
    process.exit(1);
});
