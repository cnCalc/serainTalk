'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const { ObjectID } = require('mongodb');

const dbTool = require('../../utils/database');
const testTools = require('../testTools');
const utils = require('../../utils');

let agent = supertest.agent(require('../../index'));

describe('member part', () => {
  before(async () => {
    await dbTool.prepare();
  });

  it('member signup', async () => {
    await dbTool.commonMember.removeOne({ username: testTools.member.memberInfo.username });

    let url = '/api/v1/member/signup';
    let signupBody = await agent
      .post(url)
      .send(testTools.member.memberInfo)
      .expect(201);
    expect(signupBody.body.status).to.equal('ok');
    expect(signupBody.header['set-cookie']).to.be.ok;

    let signupInfo = signupBody.body.memberinfo;
    testTools.member.checkMemberInfo(signupInfo);
    await dbTool.commonMember.removeOne({ _id: ObjectID(signupInfo._id) });
  });

  it('test my member tools', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      testTools.member.checkMemberInfo(newMemberInfo);
    });
  });

  it('signup twice.', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      await testTools.member.createOneMember(agent, async (newMemberInfo) => {
        testTools.member.checkMemberInfo(newMemberInfo);
      });
    });
  });

  it('member login', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      let url = '/api/v1/member/login';
      let loginBody = await agent
        .post(url)
        .send({
          name: newMemberInfo.username,
          password: newMemberInfo.password
        })
        .expect(201);
      expect(loginBody.body.status).to.equal('ok');
      expect(loginBody.header['set-cookie']).to.be.ok;
      let loginInfo = loginBody.body.memberinfo;
      testTools.member.checkMemberInfo(loginInfo);
    });
  });

  it('member logout', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      let loginUrl = '/api/v1/member/login';
      let loginBody = await agent
        .post(loginUrl)
        .send({
          name: newMemberInfo.username,
          password: newMemberInfo.password
        })
        .expect(201);
      expect(loginBody.body.status).to.equal('ok');
      let loginCookies = {};
      loginBody.header['set-cookie'].forEach(function (cookie) {
        Object.assign(loginCookies, utils.cookie.parse(cookie));
      });
      expect(loginCookies.membertoken).to.be.ok;

      let logoutBody = await agent
        .delete(loginUrl)
        .expect(204);
      let logoutCookies = {};
      logoutBody.header['set-cookie'].forEach(function (cookie) {
        Object.assign(logoutCookies, utils.cookie.parse(cookie));
      });
      expect(logoutCookies.membertoken).to.be.equal('');
    });
  });

  it('get member info by mongoId.', async () => {
    await testTools.member.createOneMember(agent, async (newMemberInfo) => {
      let url = `/api/v1/member/${newMemberInfo.id}`;
      let memberBody = await agent
        .get(url)
        .expect(200);
      expect(memberBody.body.status).to.equal('ok');
      delete memberBody.body.status;
      let memberInfo = memberBody.body;
      testTools.member.checkMemberInfo(memberInfo);
    });
  });

  it('get member with recent.', async () => {
    testTools.member.createOneMember(agent, async (newMemberInfo) => {
      let url = `/api/v1/member/${newMemberInfo.id}?recent=on`;
      let tempInfo = await agent
        .get(url)
        .expect(200);
      expect(tempInfo.body.status).to.equal('ok');
    });
  });

  it('get member with device', async () => {
    testTools.member.createOneMember(agent, async (newMemberInfo) => {
      let url = `/api/v1/members?device=${encodeURI(newMemberInfo.device)}`;
      let memberBody = await agent
        .get(url)
        .expect(200);
      expect(memberBody.body.status).to.equal('ok');
      delete memberBody.body.status;
      let memberList = memberBody.body.list;
      for (let member of memberList) {
        expect(member.device).to.equal(testTools.memberInfo.device);
      }
    });
  });

  it('get member with nothing', async () => {
    let url = '/api/v1/members';
    await agent
      .get(url)
      .expect(400);
  });
});
