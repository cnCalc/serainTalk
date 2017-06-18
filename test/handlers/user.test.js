'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;

let utils = require('../../utils');
const dbTool = require('../../utils/database');

let agent = supertest.agent(require('../../index'));

describe('user part', () => {
  before(async () => {
    await dbTool.prepare();
  });

  it('user signup', async () => {
    let userInfo = {
      gender: 2,
      birthyear: 1996,
      birthmonth: 8,
      birthday: 14,
      qq: '914714146',
      site: 'https://www.ntzyz.cn/',
      bio: '弱菜',
      username: 'test.zyz',
      email: 'ljy99041@163.com',
      regip: '114.232.38.5',
      regdate: 1335761157,
      device: 'Nspire CX CAS',
      password: 'fork you.'
    };
    await dbTool.db.collection('common_member').removeOne({ username: userInfo.username });

    let url = utils.tools.createRESTfulUrl('/api/v1/member/signup', userInfo);
    let signupInfo = await agent
      .post(url)
      .set('Accept', 'application/json')
      .expect(201);
    expect(signupInfo.body.status).to.equal('ok');
    signupInfo = signupInfo.body.userinfo;
    expect(signupInfo._id).to.not.be.null;
    expect(signupInfo.credentials).to.not.be.ok;
    delete userInfo.password;
    Object.keys(userInfo).forEach(key => {
      expect(userInfo[key]).to.be.oneOf([signupInfo[key], parseInt(signupInfo[key])]);
    });

    await dbTool.db.collection('common_member').removeOne({ username: userInfo.username });
  });
});
