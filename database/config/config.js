mongosh mongodb://172.22.139.146:10001
rs.initiate({
  _id: "cfgrs",
  configsvr: true,
  members: [
    { _id: 0, host: "172.22.139.146:10001" },
    { _id: 1, host: "172.22.139.146:10002" },
  ],
});

mongosh mongodb://172.22.139.146:10011
rs.initiate({
  _id: "cfgrs",
  configsvr: true,
  members: [
    { _id: 0, host: "172.22.139.146:10011" },
    { _id: 1, host: "172.22.139.146:10012" },
  ],
});
