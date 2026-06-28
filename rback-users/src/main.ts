import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Enable CORS for frontend communication ──
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
    ], // Add frontend ports here
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  // ── Global exception filter (safety net — runs after domain-specific filters) ──
  app.useGlobalFilters(new GlobalExceptionFilter());

  // ── Global validation pipe ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties not in DTO
      forbidNonWhitelisted: true, // Throw error for unexpected properties
      transform: true, // Auto-transform types (e.g. string → number)
    }),
  );

  // ── Global prefix ──
  app.setGlobalPrefix('api/v1');

  const config = app.get(ConfigService);
  const port = config.get<number>('APP_PORT', 3000);

  await app.listen(port);
  console.log(`🚀 Server running on http://localhost:${port}/api/v1`);
}
bootstrap().catch((err) => console.error(err));
