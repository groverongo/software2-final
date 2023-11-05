const { Kafka, CompressionTypes, logLevel } = require("kafkajs");

const { createClient } = require("@libsql/client");

const fs = require("fs");
const ip = require("ip");

const axios = require("axios");

const host = process.env.KAFKA_IP || ip.address();
const port = process.env.KAFKA_PORT;

const kafka = new Kafka({
  brokers: [`${host}:${port}`],
  clientId: "example-database",
});

const anime_exists = async (id) => {
  const result = await client.execute({
    sql: `SELECT count(1) FROM "anime" WHERE id = :id`,
    args: { id: Math.floor(id) },
  });
  let count = result.rows[0]["count (1)"];
  return count > 0;
};

const topic_db = "anime-insert";
const consumer = kafka.consumer({ groupId: "anime-insert-group" });
const producer = kafka.producer();

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const run = async () => {
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({ topic: topic_db, fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      message_details = {
        partition,
        offset: message.offset,
        key: message.key.toString(),
        value: message.value.toString(),
      };
      console.log(message_details);

      let exists = await anime_exists(message_details.key);
      if (exists) {
        console.log(`Anime ${message_details.key} exists in database - No Insertion`);
        return;
      }

      client
        .execute({
          sql: `INSERT INTO "anime"  VALUES (:id, :content)`,
          args: {
            id: Math.floor(message_details.key),
            content: message_details.value,
          },
        })
        .catch((err) => {
          console.log(err);
          producer.send({
            topic: topic_db,
            messages: [
              { key: message_details.key, value: message_details.value },
            ],
          });
        });
    },
  });
};

run();
