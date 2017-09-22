'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;

const dbTool = require('../../utils/database');
const testTools = require('../testTools');

let agent = supertest.agent(require('../../index'));

describe('member part', () => {
  before(async () => {
    await dbTool.prepare();
  });
  after(async () => {
    await dbTool.commonMember.removeOne({ username: testTools.memberInfo.username });
  });

  it('member signup', async () => {
    await dbTool.commonMember.removeOne({ username: testTools.memberInfo.username });

    let url = '/api/v1/member/signup';
    let signupInfo = await agent
      .post(url)
      .send(testTools.memberInfo)
      .expect(201);
    expect(signupInfo.body.status).to.equal('ok');
    expect(signupInfo.header['set-cookie']).to.be.ok;
    signupInfo = signupInfo.body.memberinfo;
    testTools.member.checkMemberInfo(signupInfo);
    Object.assign(testTools.memberInfo, signupInfo);
  });

  it('member login', async () => {
    let url = '/api/v1/member/login';
    let loginInfo = await agent
      .post(url)
      .send({
        name: testTools.memberInfo.username,
        password: testTools.memberInfo.password
      })
      .expect(201);
    expect(loginInfo.body.status).to.equal('ok');
    expect(loginInfo.header['set-cookie']).to.be.ok;
    loginInfo = loginInfo.body.memberinfo;
    testTools.member.checkMemberInfo(loginInfo);
  });

  it('get member info by mongoid.', async () => {
    let url = `/api/v1/member/${testTools.memberInfo._id}`;
    let tempInfo = await agent
      .get(url)
      .expect(200);
    expect(tempInfo.body.status).to.equal('ok');
    delete tempInfo.body.status;
    tempInfo = tempInfo.body;
    testTools.member.checkMemberInfo(tempInfo);
  });

  it('get member with recent.', async () => {
    let url = `/api/v1/member/${testTools.memberInfo._id}?recent=on`;
    let tempInfo = await agent
      .get(url)
      .expect(200);
    expect(tempInfo.body.status).to.equal('ok');
    delete tempInfo.body.status;
    tempInfo = tempInfo.body;
  });

  it('get member with device', async () => {
    let url = `/api/v1/members?device=${encodeURI(testTools.memberInfo.device)}`;
    let tempInfo = await agent
      .get(url)
      .expect(200);
    expect(tempInfo.body.status).to.equal('ok');
    delete tempInfo.body.status;
    tempInfo = tempInfo.body.list;
    for (let member of tempInfo) {
      expect(member.device).to.equal(testTools.memberInfo.device);
    }
  });

  it('get member with nothing', async () => {
    let url = '/api/v1/members';
    await agent
      .get(url)
      .expect(400);
  });
});
