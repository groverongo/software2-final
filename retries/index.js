const { Kafka, CompressionTypes, logLevel } = require("kafkajs");

const fs = require("fs");
const ip = require("ip");

const axios = require("axios");

const host = process.env.KAFKA_IP || ip.address();
const port = process.env.KAFKA_PORT;
const uri = process.env.MONGO_URI;

const {MongoClient} = require('mongodb');

const kafka = new Kafka({
  brokers: [`${host}:${port}`],
  clientId: "example-retries",
});

const topic_http = "anime-request";
const topic_db = "anime-insert";
const consumer = kafka.consumer({ groupId: "anime-request-group" });
const producer = kafka.producer();

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

const anime_exists = async (id) => {  
  let query = { "_id": Math.floor(id) };
  let cursor = await collection.find(query).toArray();
  let count = cursor.length;
  return count > 0;
};

const run = async () => {
  await consumer.connect();
  await producer.connect();

  await consumer.subscribe({ topic: topic_http, fromBeginning: true });
  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      message_details = {
        partition,
        offset: message.offset,
        value: message.value.toString(),
      };

      let exists = await anime_exists(message_details.value);
      if (exists) {
        console.log(`Anime ${message_details.key} exists in database - No Retry`);
        return;
      }

      console.log(message_details);
      console.log(`https://api.jikan.moe/v4/anime/${message_details.value}`);

      axios
        .get(`https://api.jikan.moe/v4/anime/${message_details.value}`)
        .then((jikan_resp) => {
          console.log(`Retry Status ${message_details.offset}: SUCCESS`);
          producer.send({
            topic: topic_db,
            messages: [{ key: message_details.value, value: JSON.stringify(jikan_resp.data) }],
          });
        })
        .catch((err) => {
          console.log(`Retry Status ${message_details.offset}: FAILURE`);
          producer
            .send({
              topic: topic_http,
              messages: [{ value: message_details.value }],
            })
            .catch((err) => {
              console.log(err);
            });
        });
    },
  });
};

run();
