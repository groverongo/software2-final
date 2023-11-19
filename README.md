# Sistema de retries

## Levantar Mongo Distribuido

### Levantar servidores config

Conjunto de servidores config 1 y 2

```bash
docker-compose -f database/config/docker-compose.yaml up -d
```

Acceder al conjunto 1
```bash
mongosh mongodb://172.22.139.146:10001
```
y ejecutar:
```js
rs.initiate({
  _id: "cfgrs",
  configsvr: true,
  members: [
    { _id: 0, host: "172.22.139.146:10001" },
    { _id: 1, host: "172.22.139.146:10002" },
  ],
});
```

Acceder al conjunto 2
```bash
mongosh mongodb://172.22.139.146:10011
```
y ejecutar:
```js
rs.initiate({
  _id: "cfgrs",
  configsvr: true,
  members: [
    { _id: 0, host: "172.22.139.146:10011" },
    { _id: 1, host: "172.22.139.146:10012" },
  ],
});
```

### Levantar servidores shard

Conjunto de servidores shard  1 y 2

```bash
docker-compose -f database/shard/docker-compose.yaml up -d
```

Acceder al conjunto 1
```bash
mongosh mongodb://172.22.139.146:20001
```
y ejecutar:
```js
rs.initiate({
  _id: "shard1rs",
  members: [
    { _id: 0, host: "172.22.139.146:20001" },
    { _id: 1, host: "172.22.139.146:20002" },
  ],
});
```

Acceder al conjunto 2
```bash
mongosh mongodb://172.22.139.146:20011
```
y ejecutar:
```js
rs.initiate({
  _id: "shard2rs",
  members: [
    { _id: 0, host: "172.22.139.146:20011" },
    { _id: 1, host: "172.22.139.146:20012" },
  ],
});
```

### Levantar servidor cluster

```bash
docker-compose -f database/mongos/docker-compose.yaml up -d
```

Agregar shards
```js
sh.addShard("shard1rs/172.22.139.146:20001,172.22.139.146:20002")
sh.addShard("shard2rs/172.22.139.146:20011,172.22.139.146:20012")
```

Declarar colección con shards y definir el tipo de distribución (hash por id)
```js
sh.enableSharding("anime")
sh.shardCollection("anime.anime", { '_id': 'hashed' } )
```

## Levantar arquitectura sin DB (Levantar la DB antes)

```sh
./run_docker.sh
```

## Descripción de servicios

### API

Contiene un endpoint ```/get-anime/{id}```

1. Hace la consulta a la base de datos (TURSO), si existe el anime, lo retorna y termina la llamada.
2. Hace la llamada a la api Jikan, si Jikan todavía permite que se hagan llamadas, retornar el anime y enviar el contenido a la cola Kafka con el tópico ```topic_db```.
3. Enivar el mensaje al servicio de Kafka con el topico ```topic_http``` y la respuesta http incluye que el anime no está disponible temporalmente

### Retries

Escucha el topico ```topic_http``` y realiza las siguientes instrucciones para cada mensaje.

1. Si el anime se encuentra en la base de datos (TURSO), terminar.
2. Si el anime no se encuentra en la base de datos (TURSO), realizar la llamada a la api Jikan, si Jikan todavía permite que se hagan llamadas, enviar el contenido a la cola Kafka con el tópico ```topic_db```.
3. Si Jikan no permite que se hagan llamadas, enviar el mensaje al servicio de Kafka con el topico ```topic_http```.

### Database_Insert

Escucha al topico ```topic_db``` y realiza las siguientes instrucciones para cada mensaje.

1. Si el anime se encuentra en la base de datos (TURSO), terminar.
2. Si el anime no se encuentra en la base de datos (TURSO), insertar el anime en la base de datos (TURSO).
3. Si hubo un problema en la consulta, enviar el contenido del anime al servicio de Kafka con el topico ```topic_db```.


## Ejecución
Para ejecutar el programa, se deben ejecutar los siguiente comandos:
```bash
export HOST_IP=$(ifconfig | grep -E "([0-9]{1,3}\.){3}[0-9]{1,3}" | grep -v 127.0.0.1 | awk '{ print $2 }' | cut -f2 -d: | head -n1)
docker-compose up
```
