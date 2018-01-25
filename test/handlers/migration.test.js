'use strict';

const expect = require('chai').expect;
const supertest = require('supertest');
const utils = require('../../utils');

const config = require('../../config');
const dbTool = require('../../database');
const testTools = require('../testTools');

let agent = supertest.agent(require('../../index'));

describe('migration part.', async () => {
  before('prepare config.', async () => {
    await config.prepare();
    await dbTool.prepare();
  });

  it('migration.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      // 生成一个迁移前的成员
      await dbTool.commonMember.updateOne(
        { _id: newMemberInfo._id },
        {
          $set: {
            credentials: {
              type: 'discuz',
              password: utils.md5(utils.md5(newMemberInfo.password).toLowerCase()),
            },
          },
        }
      );

      // 迁移申请
      let verifyUrl = '/api/v1/migration/verify';
      await agent.post(verifyUrl)
        .send({ name: newMemberInfo.username })
        .expect(201);

      // 执行迁移
      let performUrl = '/api/v1/migration/perform';
      await agent.post(performUrl)
        .send({
          name: newMemberInfo.username,
          newpassword: newMemberInfo.password,
          token: 'kasora',
        })
        .expect(201);

      let memberDoc = await dbTool.commonMember.findOne({ _id: newMemberInfo._id });
      expect(memberDoc.credentials.type).to.be.equal('seraintalk');
      let password = utils.md5(memberDoc.credentials.salt + newMemberInfo.password);
      expect(password).to.be.equal(memberDoc.credentials.password);
    });
  });

  it('reset email in migration', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      // 生成一个迁移前的成员
      await dbTool.commonMember.updateOne(
        { _id: newMemberInfo._id },
        {
          $set: {
            credentials: {
              type: 'discuz',
              password: utils.md5(utils.md5(newMemberInfo.password).toLowerCase()),
            },
          },
        }
      );

      // 提交新邮箱
      let verifyUrl = '/api/v1/migration/verify';
      let newEmail = `${utils.createRandomString(10)}@cncalc.org`;
      await agent.post(verifyUrl)
        .send({
          name: newMemberInfo.username,
          password: newMemberInfo.password,
          email: newEmail,
        })
        .expect(201);

      // 执行迁移
      let performUrl = '/api/v1/migration/perform';
      await agent.post(performUrl)
        .send({
          name: newMemberInfo.username,
          newpassword: newMemberInfo.password,
          token: 'kasora',
        })
        .expect(201);

      let memberDoc = await dbTool.commonMember.findOne({ _id: newMemberInfo._id });
      expect(memberDoc.credentials.type).to.be.equal('seraintalk');
      expect(memberDoc.email).to.be.equal(newEmail);
      let password = utils.md5(memberDoc.credentials.salt + newMemberInfo.password);
      expect(password).to.be.equal(memberDoc.credentials.password);
    });
  });

  it('reset email in migration with wrong password.(should be wrong)', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      // 生成一个迁移前的成员
      await dbTool.commonMember.updateOne(
        { _id: newMemberInfo._id },
        {
          $set: {
            credentials: {
              type: 'discuz',
              password: utils.md5(utils.md5(newMemberInfo.password).toLowerCase()),
            },
          },
        }
      );

      let tokenDoc = await dbTool.token.findOne({
        name: newMemberInfo.username,
        type: 'migration',
      });
      expect(tokenDoc).to.not.be.ok;
      // 提交新邮箱
      let verifyUrl = '/api/v1/migration/verify';
      let newEmail = `${utils.createRandomString(10)}@cncalc.org`;
      let a = await agent.post(verifyUrl)
        .send({
          name: newMemberInfo.username,
          password: utils.createRandomString(20),
          email: newEmail,
        })
        .expect(401);
      // 执行迁移
      let performUrl = '/api/v1/migration/perform';
      await agent.post(performUrl)
        .send({
          name: newMemberInfo.username,
          newpassword: newMemberInfo.password,
          token: 'kasora',
        })
        .expect(401);

      let memberDoc = await dbTool.commonMember.findOne({ _id: newMemberInfo._id });
      expect(memberDoc.credentials.type).to.be.equal('discuz');
      expect(memberDoc.email).to.be.equal(newMemberInfo.email);
      let password = utils.md5(utils.md5(newMemberInfo.password).toLowerCase());
      expect(password).to.be.equal(memberDoc.credentials.password);
    });
  });

  it('reset username and password.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      // 生成一个迁移前的成员
      await dbTool.commonMember.updateOne(
        { _id: newMemberInfo._id },
        {
          $set: {
            credentials: {
              type: 'discuz',
              password: utils.md5(utils.md5(newMemberInfo.password).toLowerCase()),
            },
          },
        }
      );

      // 迁移申请
      let verifyUrl = '/api/v1/migration/verify';
      await agent.post(verifyUrl)
        .send({ name: newMemberInfo.username })
        .expect(201);

      // 执行迁移
      let performUrl = '/api/v1/migration/perform';
      let newName = utils.createRandomString(10);
      let newPassword = utils.createRandomString(10);
      await agent.post(performUrl)
        .send({
          name: newMemberInfo.username,
          newname: newName,
          newpassword: newPassword,
          token: 'kasora',
        })
        .expect(201);

      let memberDoc = await dbTool.commonMember.findOne({ _id: newMemberInfo._id });
      expect(memberDoc.credentials.type).to.be.equal('seraintalk');
      expect(memberDoc.username).to.be.equal(newName);
      let password = utils.md5(memberDoc.credentials.salt + newPassword);
      expect(password).to.be.equal(memberDoc.credentials.password);
    });
  });
});
