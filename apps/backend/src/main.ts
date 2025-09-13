import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3101',
      'http://localhost:3102',
      'http://192.168.169.17:3000',
      'http://192.168.169.17:3001',
      'http://192.168.169.17:3002',
      'http://192.168.0.103:3002',
      'http://192.168.0.103:3003',
    ],
    credentials: true,
  });
  app.useStaticAssets(join(process.cwd(), 'apps', 'backend', 'uploads'), {
    prefix: '/static/uploads',
  });
  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
