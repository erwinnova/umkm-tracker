import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { BuyerModule } from './buyer.module';

async function bootstrap() {
  const app = await NestFactory.create(BuyerModule);
  
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  
  app.enableCors();
  
  const port = process.env.BUYER_PORT || 3001;
  await app.listen(port);
  console.log(`Buyer application is running on: http://localhost:${port}`);
}
bootstrap();