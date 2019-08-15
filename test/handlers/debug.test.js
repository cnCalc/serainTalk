'use strict';

const supertest = require('supertest');
const assert = require('assert');
const testTools = require('../testTools');
const utils = require('../../utils');

let app = require('../../index');
let agent = supertest.agent(app);

describe('debug part.', async () => {
  before('prepare config.', async () => {
    await app.prepare();
  });

  it('sudo in dev.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let sudoUrl = '/api/v1/debug/sudo';
      let sudoRes = await agent.get(sudoUrl).expect(201);
      assert(sudoRes.body.status === 'ok');
      assert(sudoRes.header['set-cookie']);

      let adminUrl = '/api/v1/debug/isadmin';
      let adminRes = await agent.get(adminUrl);
      assert(adminRes.body.isAdmin);

      let loginUrl = '/api/v1/member/login';
      await agent
        .post(loginUrl)
        .send({
          name: newMemberInfo.username,
          password: newMemberInfo.password,
        })
        .expect(201);
      adminUrl = '/api/v1/debug/isadmin';
      adminRes = await agent.get(adminUrl);
      assert(!adminRes.body.isAdmin);
    });
  });

  it('rollback permission in dev.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let sudoUrl = '/api/v1/debug/sudo';
      let sudoRes = await agent.get(sudoUrl).expect(201);
      assert(sudoRes.body.status === 'ok');
      assert(sudoRes.header['set-cookie']);
    });
  });

  it('notify in dev.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notificationUrl = `/api/v1/debug/notification/${newMemberInfo.id}`;
      let payload = {
        content: 'just test',
        href: 'cncalc.org',
      };
      notificationUrl = utils.url.creatorESTfulUrl(notificationUrl, payload);
      let sudoRes = await agent.get(notificationUrl).send(payload).expect(201);
      assert(sudoRes.body.status === 'ok');
    });
  });
});
