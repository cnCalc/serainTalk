'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;

let utils = require('../../utils');
const dbTool = require('../../utils/database');

let agent = supertest.agent(require('../../index'));
let memberInfo = {
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

let memberInfoCheck = (info) => {
  let _memberInfo = Object.assign({}, memberInfo);
  expect(info._id).to.not.be.null;
  expect(info.credentials).to.not.be.ok;
  delete _memberInfo.password;
  Object.keys(_memberInfo).forEach(key => {
    expect(_memberInfo[key]).to.be.oneOf([info[key], parseInt(info[key])]);
  });
};

describe('member part', () => {
  before(async () => {
    await dbTool.prepare();
  });
  after(async () => {
    await dbTool.db.collection('common_member').removeOne({ username: memberInfo.username });
  });

  it('member signup', async () => {
    await dbTool.db.collection('common_member').removeOne({ username: memberInfo.username });

    let url = utils.url.createRESTfulUrl('/api/v1/member/signup', memberInfo);
    let signupInfo = await agent
      .post(url)
      .expect(201);
    expect(signupInfo.body.status).to.equal('ok');
    expect(signupInfo.header['set-cookie']).to.be.ok;
    signupInfo = signupInfo.body.memberinfo;
    memberInfoCheck(signupInfo);
    Object.assign(memberInfo, signupInfo);
  });

  it('member login', async () => {
    let url = utils.url.createRESTfulUrl('/api/v1/member/login', {
      name: memberInfo.username,
      password: memberInfo.password
    });
    let loginInfo = await agent
      .post(url)
      .expect(201);
    expect(loginInfo.body.status).to.equal('ok');
    expect(loginInfo.header['set-cookie']).to.be.ok;
    loginInfo = loginInfo.body.memberinfo;
    memberInfoCheck(loginInfo);
  });

  it('get member info by mongoid.', async () => {
    let url = `/api/v1/member/${memberInfo._id}`;
    let tempInfo = await agent
      .get(url)
      .expect(200);
    expect(tempInfo.body.status).to.equal('ok');
    delete tempInfo.body.status;
    tempInfo = tempInfo.body;
    memberInfoCheck(tempInfo);
  });

  it('get member with recent.', async () => {
    let url = `/api/v1/member/${memberInfo._id}?recent=on`;
    let tempInfo = await agent
      .get(url)
      .expect(200);
    expect(tempInfo.body.status).to.equal('ok');
    delete tempInfo.body.status;
    tempInfo = tempInfo.body;
  });

  it('get member with device', async () => {
    let url = `/api/v1/members?device=${encodeURI(memberInfo.device)}`;
    let tempInfo = await agent
      .get(url)
      .expect(200);
    expect(tempInfo.body.status).to.equal('ok');
    delete tempInfo.body.status;
    tempInfo = tempInfo.body.list;
    for (let member of tempInfo) {
      expect(member.device).to.equal(memberInfo.device);
    }
  });

  it('get member with nothing', async () => {
    let url = '/api/v1/members';
    await agent
      .get(url)
      .expect(400);
  });
});
