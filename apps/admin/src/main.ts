import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AdminModule } from './admin.module';

async function bootstrap() {
  const app = await NestFactory.create(AdminModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  app.enableCors();
  
  const port = process.env.ADMIN_PORT || 3002;
  await app.listen(port);
  console.log(`Admin application is running on: http://localhost:${port}`);
}
bootstrap();