import { Injectable } from '@nestjs/common';

@Injectable()
export class BuyerService {
  getHello(): string {
    return 'Buyer API is running!';
  }
}