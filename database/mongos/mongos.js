sudo mongosh mongodb://172.22.139.146:30000

sh.addShard("shard1rs/172.22.139.146:20001,172.22.139.146:20002")
sh.addShard("shard2rs/172.22.139.146:20011,172.22.139.146:20012")


sh.enableSharding("anime")
sh.shardCollection("anime.anime", { '_id': 'hashed' } )