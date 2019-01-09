'use strict';

const assert = require('assert');
const fs = require('fs');
const supertest = require('supertest');

const dbTool = require('../../database');
const testTools = require('../testTools');
const utils = require('../../utils');
const config = require('../../config');
const jwt = require('jsonwebtoken');

let app = require('../../index');
let agent = supertest.agent(app);

describe('member part', () => {
  before(async () => {
    await app.prepare();
    await dbTool.prepare();
    await config.prepare();
  });

  // it('member signup', async () => {
  //   await dbTool.commonMember.removeOne({ username: testTools.testObject.memberInfo.username });

  //   let url = '/api/v1/member/signup';
  //   let signupBody = await agent
  //     .post(url)
  //     .send(testTools.testObject.memberInfo)
  //     .expect(201);
  //   expect(signupBody.body.status).to.equal('ok');
  //   expect(signupBody.header['set-cookie']).to.be.ok;

  //   let signupInfo = signupBody.body.memberinfo;
  //   testTools.member.checkMemberInfo(signupInfo);
  //   await dbTool.commonMember.removeOne({ _id: ObjectID(signupInfo._id) });
  // });

  it('test my member tools', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      testTools.member.checkMemberInfo(newMemberInfo);
    });
  });

  it('signup twice.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      try {
        await testTools.member.createOneMember(agent, null, () => Promise.resolve());
      } catch (e) {
        assert(e !== null)();
      }
    });
  });

  it('member login', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let url = '/api/v1/member/login';
      let loginBody = await agent
        .post(url)
        .send({
          name: newMemberInfo.username,
          password: newMemberInfo.password,
        })
        .expect(201);
      assert(loginBody.body.status === 'ok');
      assert(loginBody.header['set-cookie']);
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
          password: 'fakepassword',
        })
        .expect(401);
      assert(loginBody.body.status === 'error');
      assert(!loginBody.header['set-cookie']);
      assert(!loginBody.body.memberinfo);
    });
  });

  it('reset password application to a wrong member.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let url = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(url)
        .send({
          memberName: utils.createRandomString(70),
        })
        .expect(404);
      assert(applicationRes.body.status === 'error');
      assert(applicationRes.body.code === utils.errorMessages.MEMBER_NOT_EXIST.code);
    });
  });

  it('reset password.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let applicationUrl = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(applicationUrl)
        .send({
          memberName: newMemberInfo.username,
        })
        .expect(201);
      assert(applicationRes.body.status === 'ok');

      newMemberInfo = await dbTool.commonMember.findOne({ username: newMemberInfo.username });
      let emailPayload = {
        memberId: newMemberInfo._id,
        password: newMemberInfo.credentials.password,
        time: Date.now(),
      };
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let resetUrl = '/api/v1/member/password/reset';
      let newPassword = utils.createRandomString(20);
      let resetPayload = {
        token: emailToken,
        password: newPassword,
      };
      let resetRes = await agent.post(resetUrl)
        .send(resetPayload)
        .expect(201);
      assert(resetRes.body.status === 'ok');

      let loginUrl = '/api/v1/member/login';
      let loginBody = await agent
        .post(loginUrl)
        .send({
          name: newMemberInfo.username,
          password: newPassword,
        })
        .expect(201);
      assert(loginBody.body.status === 'ok');
      assert(loginBody.header['set-cookie']);
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
          memberName: newMemberInfo.username,
        })
        .expect(201);
      assert(applicationRes.body.status === 'ok');

      newMemberInfo = await dbTool.commonMember.findOne({ username: newMemberInfo.username });
      let emailPayload = utils.createRandomString(80);
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let resetUrl = '/api/v1/member/password/reset';
      let newPassword = utils.createRandomString(20);
      let resetPayload = {
        token: emailToken,
        password: newPassword,
      };
      let resetRes = await agent.post(resetUrl)
        .send(resetPayload)
        .expect(400);
      assert(resetRes.body.status === 'error');
      assert(resetRes.body.code === utils.errorMessages.BAD_REQUEST.code);
    });
  });

  it('reset password without token.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let applicationUrl = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(applicationUrl)
        .send({
          memberName: newMemberInfo.username,
        })
        .expect(201);
      assert(applicationRes.body.status === 'ok');

      newMemberInfo = await dbTool.commonMember.findOne({ username: newMemberInfo.username });
      let emailPayload = '';
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let resetUrl = '/api/v1/member/password/reset';
      let newPassword = utils.createRandomString(20);
      let resetPayload = {
        token: emailToken,
        password: newPassword,
      };
      let resetRes = await agent.post(resetUrl)
        .send(resetPayload)
        .expect(400);
      assert(resetRes.body.status === 'error');
      assert(resetRes.body.code === utils.errorMessages.BAD_REQUEST.code);
    });
  });

  it('reset password with wrong member.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let applicationUrl = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(applicationUrl)
        .send({
          memberName: newMemberInfo.username,
        })
        .expect(201);
      assert(applicationRes.body.status === 'ok');

      newMemberInfo = await dbTool.commonMember.findOne({ username: newMemberInfo.username });
      let emailPayload = {
        memberId: '5a1d7e01975cb8140be61322',
        password: newMemberInfo.credentials.password,
        time: Date.now(),
      };
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let resetUrl = '/api/v1/member/password/reset';
      let newPassword = utils.createRandomString(20);
      let resetPayload = {
        token: emailToken,
        password: newPassword,
      };
      let resetRes = await agent.post(resetUrl)
        .send(resetPayload)
        .expect(404);
      assert(resetRes.body.status === 'error');
      assert(resetRes.body.code === utils.errorMessages.MEMBER_NOT_EXIST.code);
    });
  });

  it('reset password with time out.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let applicationUrl = '/api/v1/member/password/reset/application';
      let applicationRes = await agent
        .post(applicationUrl)
        .send({
          memberName: newMemberInfo.username,
        })
        .expect(201);
      assert(applicationRes.body.status === 'ok');

      newMemberInfo = await dbTool.commonMember.findOne({ username: newMemberInfo.username });
      let emailPayload = {
        memberId: newMemberInfo._id,
        password: newMemberInfo.credentials.password,
        time: -10000,
      };
      let emailToken = jwt.sign(emailPayload, config.jwtSecret);
      let resetUrl = '/api/v1/member/password/reset';
      let newPassword = utils.createRandomString(20);
      let resetPayload = {
        token: emailToken,
        password: newPassword,
      };
      let resetRes = await agent.post(resetUrl)
        .send(resetPayload)
        .expect(403);
      assert(resetRes.body.status === 'error');
      assert(resetRes.body.code === utils.errorMessages.TOKEN_EXPIRED.code);
    });
  });

  it('member logout', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let loginUrl = '/api/v1/member/login';
      let loginBody = await agent
        .post(loginUrl)
        .send({
          name: newMemberInfo.username,
          password: newMemberInfo.password,
        });
      // .expect(201);
      assert(loginBody.body.status === 'ok');
      let loginCookies = {};
      loginBody.header['set-cookie'].forEach(function (cookie) {
        Object.assign(loginCookies, utils.cookie.parse(cookie));
      });
      assert(loginCookies.membertoken);

      let logoutBody = await agent
        .delete(loginUrl)
        .expect(204);
      let logoutCookies = {};
      logoutBody.header['set-cookie'].forEach(function (cookie) {
        Object.assign(logoutCookies, utils.cookie.parse(cookie));
      });
      assert(logoutCookies.membertoken === '');
    });
  });

  it('get member info by mongoId.', async () => {
    await testTools.member.createOneMember(agent, { email: 'i@kasora.moe' }, async (newMemberInfo) => {
      let url = `/api/v1/member/${newMemberInfo.id}`;
      let memberRes = await agent
        .get(url)
        .expect(200);
      assert(memberRes.body.status === 'ok');
      delete memberRes.body.status;
      let memberInfo = memberRes.body.memberinfo;
      testTools.member.checkMemberInfo(memberInfo);
      assert(memberInfo.email === 'i*****@k***.moe');
    });
  });

  it('get protected email by anonymous.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let url = `/api/v1/member/${newMemberInfo.id}`;
      let memberRes = await supertest.agent(app)
        .get(url)
        .expect(200);
      assert(memberRes.body.status === 'ok');
      delete memberRes.body.status;
      let memberInfo = memberRes.body.memberinfo;
      assert(!memberInfo.email);
    });
  });

  it('get public email by member.', async () => {
    await testTools.member.createOneMember(agent, { email: 'i@kasora.moe' }, async (newMemberInfoA) => {
      let settingsUrl = '/api/v1/member/settings/privacy/showEmailToMembers';
      await agent.put(settingsUrl).send({ value: true });

      // 即时放开也不允许未登录用户获取邮箱
      let url = `/api/v1/member/${newMemberInfoA.id}`;
      let memberRes = await supertest.agent(app)
        .get(url)
        .expect(200);
      assert(memberRes.body.status === 'ok');
      delete memberRes.body.status;
      let memberInfo = memberRes.body.memberinfo;
      assert(!memberInfo.email);

      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let memberRes = await agent
          .get(url)
          .expect(200);
        assert(memberRes.body.status === 'ok');
        delete memberRes.body.status;
        let memberInfo = memberRes.body.memberinfo;
        assert(memberInfo.email === 'i@kasora.moe');
      });
    });
  });

  it('get member with recent.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async () => {
        let url = `/api/v1/member/${newMemberInfo.id}?recent=on`;
        let tempInfo = await agent
          .get(url)
          .expect(200);
        assert(tempInfo.body.status === 'ok');
        assert(tempInfo.body.member.recentActivities.length === 1);
      });
    });
  });

  it('get member with deleted recent.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.discussion.createOneDiscussion(agent, null, async (newDiscussionInfo) => {
        await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
          let banUrl = `/api/v1/discussion/${newDiscussionInfo.id}/post/1`;
          await agent.delete(banUrl).expect(204);

          let url = `/api/v1/member/${newMemberInfo.id}?recent=on`;
          let tempInfo = await agent
            .get(url)
            .expect(200);
          assert(tempInfo.body.status === 'ok');
          assert(tempInfo.body.member.recentActivities.length === 1);
        });

        let url = `/api/v1/member/${newMemberInfo.id}?recent=on`;
        let tempInfo = await agent
          .get(url)
          .expect(200);
        assert(tempInfo.body.status === 'ok');
        assert(tempInfo.body.member.recentActivities.length === 0);
      });
    });
  });

  it('get member by device', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let url = `/api/v1/members?device=${encodeURI(newMemberInfo.device)}`;
      let memberBody = await agent
        .get(url)
        .expect(200);
      assert(memberBody.body.status === 'ok');
      delete memberBody.body.status;
      let memberList = memberBody.body.list;
      for (let member of memberList) {
        assert(member.device === testTools.testObject.memberInfo.device);
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
        nightMode: true,
      };
      let updateRes = await agent.put(updateUrl)
        .send(updatePayload)
        .expect(201);
      let settings = updateRes.body.settings;
      for (let key of Object.keys(updatePayload)) {
        assert(settings[key] === updatePayload[key]);
      }

      let selfUrl = '/api/v1/members/me';
      let res = await agent.get(selfUrl).expect(200);
      assert(res.body.memberInfo.settings.nightMode === true);
    });
  });

  it('update member setting more details.', async () => {
    await testTools.member.createOneMember(agent, null, async () => {
      let updateUrl = '/api/v1/member/settings/mail/onReply';
      let updatePayload = {
        value: true,
      };
      let updateRes = await agent.put(updateUrl)
        .send(updatePayload)
        .expect(201);
      let settings = updateRes.body.settings;
      assert(settings.mail.onReply === updatePayload.value);
    });
  });

  it('get member name start with special string.', async () => {
    await testTools.member.createOneMember(agent, { username: 'memberkasora' }, async () => {
      await testTools.member.createOneMember(agent, { username: 'MEMberntzyz' }, async () => {
        await testTools.member.createOneMember(agent, { username: 'kasorakira' }, async () => {
          await testTools.member.createOneMember(agent, { username: 'kasoramember' }, async () => {
            let startWithUrl = '/api/v1/members/startwith/member';
            let res = await agent.get(startWithUrl);
            let startWithBody = res.body;
            assert(startWithBody.members.length === 2);
          });
        });
      });
    });
  });

  it('upload a avatar.', async () => {
    await testTools.member.createOneMember(agent, { username: 'memberkasora' }, async () => {
      let uploadUrl = '/api/v1/member/avatar';
      let uploadRes = await agent.post(uploadUrl)
        .attach('avatar', 'test/testfile/testpng.png');

      assert(uploadRes.body.status === 'ok');

      let getUrl = `/api/v1/attachment/${uploadRes.body.avatar._id}`;
      let avatarRes = await agent.get(getUrl).expect(200);
      let file = fs.readFileSync('test/testfile/testpng.png');

      assert(file.equals(avatarRes.body) === true);

      let deleteUrl = `/api/v1/attachment/${uploadRes.body.avatar._id}`;
      await agent.delete(deleteUrl).expect(204);
    });
  });

  it('upload and extract a avatar.', async () => {
    await testTools.member.createOneMember(agent, { username: 'memberkasora' }, async () => {
      let uploadUrl = '/api/v1/member/avatar?left=0&top=0&width=1&height=1';
      let uploadRes = await agent.post(uploadUrl)
        .attach('avatar', 'test/testfile/testpng.png');

      assert(uploadRes.body.status === 'ok');

      let getUrl = `/api/v1/attachment/${uploadRes.body.avatar._id}`;
      let avatarRes = await agent.get(getUrl).expect(200);
      let file = fs.readFileSync('test/testfile/avatar-sharp.png');

      assert(file.equals(avatarRes.body) === true);

      let deleteUrl = `/api/v1/attachment/${uploadRes.body.avatar._id}`;
      await agent.delete(deleteUrl).expect(204);
    });
  });

  it('update email', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      // console.log(newMemberInfo);
      let verifyUrl = '/api/v1/member/email/verify';
      await agent.post(verifyUrl)
        .send({ email: 'kasorasun@gmail.com' });
      let updateUrl = '/api/v1/member/email';
      await agent.put(updateUrl)
        .send({ token: '000000' });
      let selfUrl = '/api/v1/member/me';
      let memberRes = await agent.get(selfUrl);
      let memberInfo = memberRes.body.memberInfo;
      assert(memberInfo.email === 'kasorasun@gmail.com');
    });
  });

  it('update email with wrong token', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      // console.log(newMemberInfo);
      let verifyUrl = '/api/v1/member/email/verify';
      await agent.post(verifyUrl)
        .send({ email: 'kasorasun@gmail.com' });
      let updateUrl = '/api/v1/member/email';
      await agent.put(updateUrl)
        .send({ token: '000001' });
      let selfUrl = '/api/v1/member/me';
      let memberRes = await agent.get(selfUrl);
      let memberInfo = memberRes.body.memberInfo;
      assert(memberInfo.email === newMemberInfo.email);
    });
  });
});
