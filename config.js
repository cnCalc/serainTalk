module.exports = {
  database: 'mongodb://localhost:27017/cncalc?autoReconnect=true',
  pagesize: 10,
  jwtSecret: 'exampleSecret',
  cookie: {
    renewTime: 86400000
  },
  tokenValidTime: 1000 * 60 * 10
};
