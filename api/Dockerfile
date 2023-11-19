FROM node:18-alpine

WORKDIR /app

COPY . .

RUN npm install

ENV PORT=3000
ENV KAFKA_PORT=9092

EXPOSE 3000

CMD ["node", "index.js"]