import { Injectable } from '@nestjs/common';
import { configuration } from './config/configuration';

@Injectable()
export class AppService {
  private readonly config = configuration();

  getHello(): string {
    return 'Hello World!';
  }

  // Example: Access configuration values
  getKafkaConfig() {
    return this.config.kafka;
  }

  getAppPort() {
    return this.config.app.port;
  }
}
