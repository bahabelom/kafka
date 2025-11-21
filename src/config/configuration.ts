/**
 * This function exports a configuration object with environment variables for the application,
 * including app settings and Kafka configuration.
 */
export const configuration = () => ({
  NODE_ENV: process.env.NODE_ENV,
  app: {
    port: parseInt(process.env.PORT ?? '3000', 10),
    name: process.env.APP_NAME,
    description: process.env.APP_DESCRIPTION,
    version: process.env.APP_VERSION,
    isProduction: process.env.NODE_ENV === 'production',
  },
  kafka: {
    brokers: process.env.KAFKA_BROKERS?.split(',') || ['localhost:9092'],
    clientId: process.env.KAFKA_CLIENT_ID || 'kafka-practice-app',
    groupId: process.env.KAFKA_GROUP_ID || 'kafka-practice-group',
    topics: {
      example: process.env.KAFKA_TOPIC_EXAMPLE || 'example-topic',
    },
    consumer: {
      sessionTimeout: parseInt(process.env.KAFKA_CONSUMER_SESSION_TIMEOUT ?? '30000', 10),
      heartbeatInterval: parseInt(process.env.KAFKA_CONSUMER_HEARTBEAT_INTERVAL ?? '3000', 10),
    },
    producer: {
      maxInFlightRequests: parseInt(process.env.KAFKA_PRODUCER_MAX_IN_FLIGHT_REQUESTS ?? '1', 10),
      idempotent: process.env.KAFKA_PRODUCER_IDEMPOTENT === 'true' || true,
    },
  },
});

