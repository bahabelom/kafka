import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, Producer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka = new Kafka({
    clientId: 'my-app',
    brokers: ['localhost:9092'], // make sure Kafka is running here
  });

  private producer: Producer = this.kafka.producer();
  private consumer: Consumer = this.kafka.consumer({ groupId: 'my-group' });

  async onModuleInit() {
    // Connect producer and consumer
    await this.producer.connect();
    await this.consumer.connect();

    // Subscribe to topic
    await this.consumer.subscribe({ topic: 'test-topic', fromBeginning: true });

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
      topic: 'test-topic',
      messages: [{ value: message }],
    });
    console.log(`Sent message: ${message}`);
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }
}
