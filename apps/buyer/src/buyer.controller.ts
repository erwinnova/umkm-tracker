import { Controller, Get } from '@nestjs/common';
import { BuyerService } from './buyer.service';

@Controller()
export class BuyerController {
  constructor(private readonly buyerService: BuyerService) {}

  @Get()
  getHello(): string {
    return this.buyerService.getHello();
  }
}