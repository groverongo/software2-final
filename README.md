# Sistema de retries

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
