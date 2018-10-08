exports = module.exports = class Service {
  constructor (req, res) {
    this.query = req.query;
    this.body = req.body;
    this.params = req.params;
    this.member = req.member;

    this.output = { status: 'ok' };
    this.status = 200;
    this.res = res;
  }

  send () {
    this.res.status(this.status).send(output);
  }
};
