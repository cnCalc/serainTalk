'use strict';

const supertest = require('supertest');
const assert = require('assert');
const testTools = require('../testTools');
const errorMessages = require('../../utils/error-messages');
const config = require('../../config');
const utils = require('../../utils');
const _ = require('lodash');

let app = require('../../index');
let agent = supertest.agent(app);

describe('notification part', async () => {
  before(async () => {
    await app.prepare();
    await config.prepare();
  });

  it('send notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notification = {
        content: 'hello world',
      };
      await utils.notification.sendNotification(newMemberInfo._id, notification);
      let getUrl = '/api/v1/notification';
      let notificationRes = await agent.get(getUrl)
        .expect(200);
      let notifications = notificationRes.body.notifications;

      for (let key of Object.keys(notification)) {
        assert(_.last(notifications)[key] === notification[key]);
      }
      assert(!Object.keys(_.last(notifications)).includes('href'));
      assert(_.last(notifications).index === notifications.length);
    });
  });

  it('send notification without href.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notification = {
        content: 'hello world',
        href: 'cncalc.org',
      };
      await utils.notification.sendNotification(newMemberInfo._id, notification);
      let getUrl = '/api/v1/notification';
      let notificationRes = await agent.get(getUrl)
        .expect(200);
      let notifications = notificationRes.body.notifications;
      ;

      for (let key of Object.keys(notification)) {
        assert(_.last(notifications)[key] === notification[key]);
      }
      assert(_.last(notifications).index === notifications.length);
    });
  });

  it('send wrong notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notification = {
        content: 'hello world',
      };
      try {
        await utils.notification.sendNotification(utils.creatorandomString(24, { hax: true }), notification);
        throw new Error('it should be wrong.');
      } catch (err) {
        assert(err.code === errorMessages.MEMBER_NOT_EXIST.code);
      }
    });
  });

  it('get notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notification = {
        content: 'hello world',
        href: 'cncalc.org',
      };
      for (let i = 0; i < config.pagesize + 1; i++) {
        await utils.notification.sendNotification(newMemberInfo._id, notification);
      }
      let getUrl = '/api/v1/notification';
      let notificationRes = await agent.get(getUrl)
        .expect(200);
      notificationRes = notificationRes.body;
      let notifications = notificationRes.notifications;
      let count = notificationRes.count;
      assert(notifications.length === config.pagesize);
      assert(count === config.pagesize + 1);
    });
  });

  it('get empty notification list.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let getUrl = '/api/v1/notification';
      let nitificationRes = await agent.get(getUrl)
        .expect(200);
      nitificationRes = nitificationRes.body;
      let notifications = nitificationRes.notifications;
      let count = nitificationRes.count;
      assert(notifications.length === 0);
      assert(count === 0);
    });
  });

  it('read notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notification = {
        content: 'hello world',
        href: 'cncalc.org',
      };
      for (let i = 0; i < 2; i++) {
        await utils.notification.sendNotification(newMemberInfo._id, notification);
      }

      let readUrl = '/api/v1/notification/1/read';
      await agent.post(readUrl)
        .expect(201);

      let getUrl = '/api/v1/notification?pagesize=2';
      let nitificationRes = await agent.get(getUrl)
        .expect(200);
      nitificationRes = nitificationRes.body;
      let notifications = nitificationRes.notifications;
      assert(notifications.find((item) => item.index === 1).hasRead === true);
      assert(notifications.find((item) => item.index === 2).hasRead === false);
    });
  });

  it('read all notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notification = {
        content: 'hello world',
        href: 'cncalc.org',
      };
      for (let i = 0; i < 5; i++) {
        await utils.notification.sendNotification(newMemberInfo._id, notification);
      }

      let readUrl = '/api/v1/notification/all/read';
      await agent.post(readUrl)
        .expect(201);

      let getUrl = '/api/v1/notification?pagesize=5';
      let nitificationRes = await agent.get(getUrl)
        .expect(200);
      nitificationRes = nitificationRes.body;
      let notifications = nitificationRes.notifications;
      for (let notification of notifications) {
        assert(notification.hasRead === true);
      }
    });
  });

  it('only read your notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      let notification = {
        content: 'hello world',
        href: 'cncalc.org',
      };
      let getUrl = '/api/v1/notification?pagesize=10';
      for (let i = 0; i < 5; i++) {
        await utils.notification.sendNotification(newMemberInfoA._id, notification);
      }

      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        for (let i = 0; i < 5; i++) {
          await utils.notification.sendNotification(newMemberInfoB._id, notification);
        }
        let readUrl = '/api/v1/notification/all/read';
        await agent.post(readUrl)
          .expect(201);

        let nitificationRes = await agent.get(getUrl)
          .expect(200);
        nitificationRes = nitificationRes.body;
        let notifications = nitificationRes.notifications;
        for (let notification of notifications) {
          assert(notification.hasRead === true);
        }
      });

      // 验证 A 的通知是否被误读
      let nitificationRes = await agent.get(getUrl)
        .expect(200);
      nitificationRes = nitificationRes.body;
      let notifications = nitificationRes.notifications;
      for (let notification of notifications) {
        assert(notification.hasRead === false);
      }
    });
  });
});
