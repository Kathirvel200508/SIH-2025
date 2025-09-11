import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3101',
      'http://localhost:3102',
    ],
    credentials: true,
  });
  app.useStaticAssets(join(process.cwd(), 'apps', 'backend', 'uploads'), {
    prefix: '/static/uploads',
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
