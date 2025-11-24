import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';
import { configuration } from '../config/configuration';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly config = configuration();
  private kafka = new Kafka({
    clientId: this.config.kafka.clientId,
    brokers: this.config.kafka.brokers,
  });

  private producer: Producer = this.kafka.producer({
    maxInFlightRequests: this.config.kafka.producer.maxInFlightRequests,
    idempotent: this.config.kafka.producer.idempotent,
  });
  private consumer: Consumer = this.kafka.consumer({ 
    groupId: this.config.kafka.groupId,
    sessionTimeout: this.config.kafka.consumer.sessionTimeout,
    heartbeatInterval: this.config.kafka.consumer.heartbeatInterval,
  });

  async onModuleInit() {
    // Connect producer and consumer
    await this.producer.connect();
    await this.consumer.connect();

    // Subscribe to topic
    await this.consumer.subscribe({ topic: this.config.kafka.topics.example, fromBeginning: true });

    // Listen for messages
    await this.consumer.run({
      eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
        console.log(`Received message: ${message.value?.toString()}`);
      },
    });

    console.log('Kafka Producer and Consumer are ready');
  }

  async sendMessage(message: string) {
    await this.producer.send({
      topic: this.config.kafka.topics.example,
      messages: [{ value: message }],
    });
    console.log(`Sent message: ${message}`);
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }
}
