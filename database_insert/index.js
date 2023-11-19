const { Kafka, CompressionTypes, logLevel } = require("kafkajs");

const fs = require("fs");
const ip = require("ip");

const axios = require("axios");

const { MongoClient } = require("mongodb");

const host = process.env.KAFKA_IP || ip.address();
const port = process.env.KAFKA_PORT;
const uri = process.env.MONGO_URI;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const database = client.db("anime");
const collection = database.collection("anime");

const kafka = new Kafka({
  brokers: [`${host}:${port}`],
  clientId: "example-database",
});

const anime_exists = async (id) => {
  let query = { _id: Math.floor(id) };
  let cursor = await collection.find(query).toArray();
  let count = cursor.length;
  return count > 0;
};

const topic_db = "anime-insert";
const consumer = kafka.consumer({ groupId: "anime-insert-group" });
const producer = kafka.producer();

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
        console.log(
          `Anime ${message_details.key} exists in database - No Insertion`
        );
        return;
      }

      collection
        .insertOne({
          _id: Math.floor(message_details.key),
          content: JSON.parse(message_details.value),
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
