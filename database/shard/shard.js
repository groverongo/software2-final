sudo mongosh mongodb://172.22.139.146:20001
rs.initiate({
  _id: "shard1rs",
  members: [
    { _id: 0, host: "172.22.139.146:20001" },
    { _id: 1, host: "172.22.139.146:20002" },
  ],
});

sudo mongosh mongodb://172.22.139.146:20011
rs.initiate({
  _id: "shard2rs",
  members: [
    { _id: 0, host: "172.22.139.146:20011" },
    { _id: 1, host: "172.22.139.146:20012" },
  ],
});
