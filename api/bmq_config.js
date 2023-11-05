const { Kafka, CompressionTypes, logLevel } = require("kafkajs");

const express = require("express");

const fs = require("fs");
const ip = require("ip");

const host = process.env.KAFKA_IP || ip.address();
const port = process.env.KAFKA_PORT;

const kafka = new Kafka({
  brokers: [`${host}:${port}`],
  clientId: "example-producer",
});

const topic_http = "anime-request";
const topic_db = "anime-insert";
const producer = kafka.producer();

module.exports = {
    producer,
    topic_http,
    topic_db
};