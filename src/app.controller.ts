import { Controller, Get, Post, Body } from '@nestjs/common';
import { AppService } from './app.service';
import { KafkaService } from './kafka/kafka.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly kafkaService: KafkaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Post('kafka/send')
  async sendMessage(@Body() body: { message: string }) {
    try {
      await this.kafkaService.sendMessage(body.message);
      return {
        success: true,
        message: `Message "${body.message}" sent to Kafka successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
