import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { Kafka, Consumer, Producer, EachMessagePayload, Partitioners } from 'kafkajs';
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
    createPartitioner: Partitioners.LegacyPartitioner, // Silence partitioner warning
  });
  private consumer: Consumer = this.kafka.consumer({ 
    groupId: this.config.kafka.groupId,
    sessionTimeout: this.config.kafka.consumer.sessionTimeout,
    heartbeatInterval: this.config.kafka.consumer.heartbeatInterval,
  });

  async onModuleInit() {
    try {
      // Connect producer and consumer
      await this.producer.connect();
      console.log('Kafka Producer connected successfully');
      
      await this.consumer.connect();
      console.log('Kafka Consumer connected successfully');

      // Ensure topic exists (create if it doesn't)
      await this.ensureTopicExists(this.config.kafka.topics.example);

      // Subscribe to topic with retry logic
      await this.subscribeWithRetry();

      console.log('Kafka Producer and Consumer are ready');
    } catch (error) {
      console.error('Failed to initialize Kafka connections:', error.message);
      console.error(`Make sure Kafka is running on ${this.config.kafka.brokers.join(', ')}`);
      console.error('You can start Kafka using: docker-compose up -d');
      // Don't throw - allow the app to start even if Kafka is not available
      // The service will retry on next message send
    }
  }

  private async ensureTopicExists(topicName: string): Promise<void> {
    const admin = this.kafka.admin();
    try {
      await admin.connect();
      const topics = await admin.listTopics();
      if (!topics.includes(topicName)) {
        await admin.createTopics({
          topics: [{
            topic: topicName,
            numPartitions: 1,
            replicationFactor: 1,
          }],
        });
        console.log(`Created topic: ${topicName}`);
      }
      await admin.disconnect();
    } catch (error) {
      console.warn(`Could not ensure topic exists (it may be created automatically): ${error.message}`);
      try {
        await admin.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
  }

  private async subscribeWithRetry(maxRetries = 5, delayMs = 1000): Promise<void> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.consumer.subscribe({ topic: this.config.kafka.topics.example, fromBeginning: true });

        // Listen for messages
        await this.consumer.run({
          eachMessage: async ({ topic, partition, message }: EachMessagePayload) => {
            console.log(`Received message from topic ${topic}, partition ${partition}: ${message.value?.toString()}`);
          },
        });
        return; // Success
      } catch (error) {
        if (attempt === maxRetries) {
          console.error(`Failed to subscribe after ${maxRetries} attempts:`, error.message);
          throw error;
        }
        console.warn(`Subscription attempt ${attempt} failed, retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }

  async sendMessage(message: string) {
    try {
      await this.producer.send({
        topic: this.config.kafka.topics.example,
        messages: [{ value: message }],
      });
      console.log(`Sent message to topic ${this.config.kafka.topics.example}: ${message}`);
    } catch (error) {
      console.error('Failed to send message to Kafka:', error.message);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.producer.disconnect();
    await this.consumer.disconnect();
  }
}
