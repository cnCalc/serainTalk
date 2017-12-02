'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');
const config = require('../../config');
const utils = require('../../utils');
const _ = require('lodash');

let agent = supertest.agent(require('../../index'));

describe('notification part', async () => {
  it('send notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notification = {
        content: 'hello world'
      };
      await utils.notification.sendNotification(newMemberInfo._id, notification);
      let getUrl = '/api/v1/notification';
      let notificationRes = await agent.get(getUrl)
        .expect(200);
      let notifications = notificationRes.body.notifications;
      expect(notifications).to.be.an('array');
      expect(_.last(notifications)).include(notification);
      expect(Object.keys(_.last(notifications))).not.include('href');
      expect(_.last(notifications).index).to.be.equal(notifications.length);
    });
  });

  it('send notification without href.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notification = {
        content: 'hello world',
        href: 'cncalc.org'
      };
      await utils.notification.sendNotification(newMemberInfo._id, notification);
      let getUrl = '/api/v1/notification';
      let notificationRes = await agent.get(getUrl)
        .expect(200);
      let notifications = notificationRes.body.notifications;
      expect(notifications).to.be.an('array');
      expect(_.last(notifications)).include(notification);
      expect(_.last(notifications).index).to.be.equal(notifications.length);
    });
  });

  it('get notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notification = {
        content: 'hello world',
        href: 'cncalc.org'
      };
      for (let i = 0; i < config.pagesize + 1; i++) {
        await utils.notification.sendNotification(newMemberInfo._id, notification);
      }
      let getUrl = '/api/v1/notification';
      let nitificationRes = await agent.get(getUrl)
        .expect(200);
      nitificationRes = nitificationRes.body;
      let notifications = nitificationRes.notifications;
      let count = nitificationRes.count;
      expect(notifications.length).to.be.equal(config.pagesize);
      expect(count).to.be.equal(config.pagesize + 1);
    });
  });

  it('read notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let notification = {
        content: 'hello world',
        href: 'cncalc.org'
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
      expect(notifications.find((item) => item.index === 1)).to.includes({ index: 1, hasRead: true });
      expect(notifications.find((item) => item.index === 2)).to.includes({ index: 2, hasRead: false });
    });
  });
});
