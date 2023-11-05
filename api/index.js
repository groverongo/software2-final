const express = require("express");
const app = express();
const port = process.env.PORT;

const axios = require("axios");


const { createClient } = require("@libsql/client");

const { producer, topic_db, topic_http } = require("./bmq_config");

const client = createClient({
  url: process.env.TURSO_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

let anime_exists = async (id) => {
  const result = await client.execute({
    sql: `SELECT count(1) FROM "anime" WHERE id = :id`,
    args: { id: Math.floor(id) },
  });
  let count = result.rows[0]["count (1)"];
  return count > 0;
};

const get_anime = async (id) => {
  const result = await client.execute({
    sql: `SELECT content FROM "anime" WHERE id = :id`,
    args: { id: id },
  });
  return result.rows[0]["content"];
};

app.get("/get-anime/:id", async (req, res) => {
  const id = req.params.id;
  
  let exists = await anime_exists(id);
  if (exists) {
    console.log(`Anime ${id} exists in database`);
    let content = await get_anime(id);
    res.send(content);
    return;
  }
  
  axios
  .get(`https://api.jikan.moe/v4/anime/${id}`)
  .then((jikan_resp) => {
    res.send(jikan_resp.data);
    let message = { key: id, value: JSON.stringify(jikan_resp.data) }
    console.log(message)
    producer.send({
      topic: topic_db,
      messages: [message],
    });
  })
  .catch((err) => {
    if (err.response) {
      let status_code = err.response.status;
      if (status_code == 429) {
        producer.send({
          topic: topic_http,
          messages: [{ value: id }],
        });
        res.send(`Anime not accessible at the moment`);
      } else {
        res.send(`Anime not found`);
      }
    } else {
      console.log(err);
    }
  });
});

app.listen(port, () => {
  producer.connect();
  console.log(`KAFKA_IP ${process.env.KAFKA_IP}`);
  console.log(`API server ${port}`);
});
