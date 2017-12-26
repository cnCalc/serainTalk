'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const { ObjectID } = require('mongodb');

const dbTool = require('../../database');
const testTools = require('../testTools');
const utils = require('../../utils');
const config = require('../../config');
const jwt = require('jsonwebtoken');

let agent = supertest.agent(require('../../index'));

describe('member part', () => {
  before(async () => {
    await dbTool.prepare();
    await config.prepare();
  });

  it('member signup', async () => {
    await dbTool.commonMember.removeOne({ username: testTools.testObject.memberInfo.username });

    let url = '/api/v1/member/signup';
    let signupBody = await agent
      .post(url)
      .send(testTools.testObject.memberInfo)
      .expect(201);
    expect(signupBody.body.status).to.equal('ok');
    expect(signupBody.header['set-cookie']).to.be.ok;

    let signupInfo = signupBody.body.memberinfo;
    testTools.member.checkMemberInfo(signupInfo);
    await dbTool.commonMember.removeOne({ _id: ObjectID(signupInfo._id) });
  });

  it('test my member tools', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      testTools.member.checkMemberInfo(newMemberInfo);
    });
  });

  it('signup twice.', async () => {
    let url = '/api/v1/member/signup';
    let signupBody = await agent
      .post(url)
      .send(testTools.testObject.memberInfo)
      .expect(201);
    expect(signupBody.body.status).to.equal('ok');
    expect(signupBody.header['set-cookie']).to.be.ok;

    let signupInfo = signupBody.body.memberinfo;
    testTools.member.checkMemberInfo(signupInfo);

    await agent
      .post(url)
      .send(testTools.testObject.memberInfo)
      .expect(400);

    await dbTool.commonMember.removeOne({ _id: ObjectID(signupInfo._id) });
  });

  it('member login', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
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

  it('member login with wrong password.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let url = '/api/v1/member/login';
      let loginBody = await agent
        .post(url)
        .send({
          name: newMemberInfo.username,
          password: 'fakepassword'
        })
        .expect(401);
      expect(loginBody.body.status).to.equal('error');
      expect(loginBody.header['set-cookie']).to.not.be.ok;
      expect(loginBody.body.memberinfo).to.not.be.ok;
    });
  });

  it('reset password application to a wrong member.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let url = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(url)
        .send({
          memberName: utils.createRandomString(70)
        })
        .expect(400);
      expect(applicationRes.body.status).to.be.equal('error');
      expect(applicationRes.body.message).to.be.equal(utils.errorMessages.MEMBER_NOT_EXIST);
    });
  });

  it('reset password.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let applicationUrl = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(applicationUrl)
        .send({
          memberName: newMemberInfo.username
        })
        .expect(201);
      expect(applicationRes.body.status).to.be.equal('ok');

      newMemberInfo = await dbTool.commonMember.findOne({ username: newMemberInfo.username });
      let emailPayload = {
        memberId: newMemberInfo._id,
        password: newMemberInfo.credentials.password,
        time: Date.now()
      };
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let resetUrl = '/api/v1/member/password/reset';
      let newPassword = utils.createRandomString(20);
      let resetPayload = {
        token: emailToken,
        password: newPassword
      };
      let resetRes = await agent.post(resetUrl)
        .send(resetPayload)
        .expect(201);
      expect(resetRes.body.status).to.be.equal('ok');

      let loginUrl = '/api/v1/member/login';
      let loginBody = await agent
        .post(loginUrl)
        .send({
          name: newMemberInfo.username,
          password: newPassword
        })
        .expect(201);
      expect(loginBody.body.status).to.equal('ok');
      expect(loginBody.header['set-cookie']).to.be.ok;
      let loginInfo = loginBody.body.memberinfo;
      testTools.member.checkMemberInfo(loginInfo);
    });
  });

  it('reset password with bad token.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let applicationUrl = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(applicationUrl)
        .send({
          memberName: newMemberInfo.username
        })
        .expect(201);
      expect(applicationRes.body.status).to.be.equal('ok');

      newMemberInfo = await dbTool.commonMember.findOne({ username: newMemberInfo.username });
      let emailPayload = utils.createRandomString(80);
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let resetUrl = '/api/v1/member/password/reset';
      let newPassword = utils.createRandomString(20);
      let resetPayload = {
        token: emailToken,
        password: newPassword
      };
      let resetRes = await agent.post(resetUrl)
        .send(resetPayload)
        .expect(400);
      expect(resetRes.body.status).to.be.equal('error');
      expect(resetRes.body.message).to.be.equal(utils.errorMessages.BAD_REQUEST);
    });
  });

  it('reset password without token.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let applicationUrl = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(applicationUrl)
        .send({
          memberName: newMemberInfo.username
        })
        .expect(201);
      expect(applicationRes.body.status).to.be.equal('ok');

      newMemberInfo = await dbTool.commonMember.findOne({ username: newMemberInfo.username });
      let emailPayload = '';
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let resetUrl = '/api/v1/member/password/reset';
      let newPassword = utils.createRandomString(20);
      let resetPayload = {
        token: emailToken,
        password: newPassword
      };
      let resetRes = await agent.post(resetUrl)
        .send(resetPayload)
        .expect(400);
      expect(resetRes.body.status).to.be.equal('error');
      expect(resetRes.body.message).to.be.equal(utils.errorMessages.BAD_REQUEST);
    });
  });

  it('reset password with wrong member.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let applicationUrl = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(applicationUrl)
        .send({
          memberName: newMemberInfo.username
        })
        .expect(201);
      expect(applicationRes.body.status).to.be.equal('ok');

      newMemberInfo = await dbTool.commonMember.findOne({ username: newMemberInfo.username });
      let emailPayload = {
        memberId: '5a1d7e01975cb8140be61322',
        password: newMemberInfo.credentials.password,
        time: Date.now()
      };
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let resetUrl = '/api/v1/member/password/reset';
      let newPassword = utils.createRandomString(20);
      let resetPayload = {
        token: emailToken,
        password: newPassword
      };
      let resetRes = await agent.post(resetUrl)
        .send(resetPayload)
        .expect(400);
      expect(resetRes.body.status).to.be.equal('error');
      expect(resetRes.body.message).to.be.equal(utils.errorMessages.MEMBER_NOT_EXIST);
    });
  });

  it('reset password with time out.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let applicationUrl = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(applicationUrl)
        .send({
          memberName: newMemberInfo.username
        })
        .expect(201);
      expect(applicationRes.body.status).to.be.equal('ok');

      newMemberInfo = await dbTool.commonMember.findOne({ username: newMemberInfo.username });
      let emailPayload = {
        memberId: newMemberInfo._id,
        password: newMemberInfo.credentials.password,
        time: -10000
      };
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let resetUrl = '/api/v1/member/password/reset';
      let newPassword = utils.createRandomString(20);
      let resetPayload = {
        token: emailToken,
        password: newPassword
      };
      let resetRes = await agent.post(resetUrl)
        .send(resetPayload)
        .expect(403);
      expect(resetRes.body.status).to.be.equal('error');
      expect(resetRes.body.message).to.be.equal(utils.errorMessages.TIME_OUT);
    });
  });

  it('member logout', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let loginUrl = '/api/v1/member/login';
      let loginBody = await agent
        .post(loginUrl)
        .send({
          name: newMemberInfo.username,
          password: newMemberInfo.password
        });
      // .expect(201);
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
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let url = `/api/v1/member/${newMemberInfo.id}`;
      let memberRes = await agent
        .get(url)
        .expect(200);
      expect(memberRes.body.status).to.equal('ok');
      delete memberRes.body.status;
      let memberInfo = memberRes.body.memberinfo;
      testTools.member.checkMemberInfo(memberInfo);
    });
  });

  it('get member with recent.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async () => {
        let url = `/api/v1/member/${newMemberInfo.id}?recent=on`;
        let tempInfo = await agent
          .get(url)
          .expect(200);
        expect(tempInfo.body.status).to.equal('ok');
      });
    });
  });

  it('get member by device', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let url = `/api/v1/members?device=${encodeURI(newMemberInfo.device)}`;
      let memberBody = await agent
        .get(url)
        .expect(200);
      expect(memberBody.body.status).to.equal('ok');
      delete memberBody.body.status;
      let memberList = memberBody.body.list;
      for (let member of memberList) {
        expect(member.device).to.equal(testTools.testObject.memberInfo.device);
      }
    });
  });

  it('get member with nothing', async () => {
    let url = '/api/v1/members';
    await agent
      .get(url)
      .expect(400);
  });

  it('update member setting.', async () => {
    await testTools.member.createOneMember(agent, null, async () => {
      let updateUrl = '/api/v1/member/settings';
      let updatePayload = {
        nightMode: 'on'
      };
      let updateRes = await agent.put(updateUrl)
        .send(updatePayload)
        .expect(201);
      let settings = updateRes.body.settings;
      for (let key of Object.keys(updatePayload)) {
        expect(settings[key]).to.be.equal(updatePayload[key]);
      }
    });
  });
});
