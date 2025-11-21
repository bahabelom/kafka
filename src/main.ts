import { config } from 'dotenv';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { configuration } from './config/configuration';

// Load .env file
config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = configuration();
  await app.listen(config.app.port);
  console.log(`Application is running on: http://localhost:${config.app.port}`);
}
bootstrap();
