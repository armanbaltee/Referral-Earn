import { connectDatabase } from './config/database.js';
import { env } from './config/env.js';
import app from './app.js';

const PORT = env.PORT;

async function startServer(): Promise<void> {
  try {
    // Connect to MongoDB first
    await connectDatabase();

    const server = app.listen(PORT, () => {
      console.info(`🚀 ChainX Server running on port ${PORT}`);
      console.info(`🌍 Environment: ${env.NODE_ENV}`);
      console.info(`📦 API: ${env.APP_URL}/api/v1`);

      if (env.NODE_ENV !== 'production') {
        console.info(`📖 Swagger docs: ${env.APP_URL}/api/docs`);
      }
    });

    // ─── Graceful Shutdown ─────────────────────────────────────────────────────
    const shutdown = (signal: string) => {
      console.info(`\n⚙️  Received ${signal}. Graceful shutdown initiated...`);
      server.close(async () => {
        const { disconnectDatabase } = await import('./config/database.js');
        await disconnectDatabase();
        console.info('✅ Graceful shutdown complete');
        process.exit(0);
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown after timeout');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      console.error('❌ Unhandled Rejection:', reason);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (err: Error) => {
      console.error('❌ Uncaught Exception:', err.message);
      server.close(() => process.exit(1));
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
}

void startServer();
