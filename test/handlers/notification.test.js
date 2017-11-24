'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');
const config = require('../../config');

let agent = supertest.agent(require('../../index'));

describe('notification part', async () => {
  it('send notification.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
        let url = `/api/v1/notification/${newMemberInfo.id}`;
        let payload = {
          content: 'hello, here is test notification.',
          href: 'test/notification'
        };
        let notificationRes = await agent.post(url)
          .send(payload)
          .expect(201);
        notificationRes = notificationRes.body;
        expect(notificationRes.status).to.be.equal('ok');
        expect(payload.content).to.be.equal(notificationRes.newNotification.content);
        expect(payload.href).to.be.equal(notificationRes.newNotification.href);
        expect(notificationRes.newNotification.href).to.be.ok;
        expect(notificationRes.newNotification.index).to.be.ok;
        expect(notificationRes.newNotification.hasRead).to.not.be.ok;
      });
    });
  });

  it('send notification without href.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
        let url = `/api/v1/notification/${newMemberInfo.id}`;
        let payload = {
          content: 'hello, here is test notification.'
        };
        let notificationRes = await agent.post(url)
          .send(payload)
          .expect(201);
        notificationRes = notificationRes.body;
        expect(notificationRes.status).to.be.equal('ok');
        expect(payload.content).to.be.equal(notificationRes.newNotification.content);
        expect(payload.href).to.be.equal(notificationRes.newNotification.href);
        expect(notificationRes.newNotification.href).to.not.be.ok;
        expect(notificationRes.newNotification.index).to.be.ok;
        expect(notificationRes.newNotification.hasRead).to.not.be.ok;
      });
    });
  });

  it('get notification', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      await testTools.member.setAdmin(agent, newMemberInfo._id, async () => {
        let postUrl = `/api/v1/notification/${newMemberInfo.id}`;
        let payload = {
          content: 'hello, here is test message.'
        };
        for (let i = 0; i < config.pagesize + 1; i++) {
          await agent.post(postUrl)
            .send(payload)
            .expect(201);
        }
        let getUrl = '/api/v1/notification';
        let messageRes = await agent.get(getUrl)
          .expect(200);
        messageRes = messageRes.body;
        let messages = messageRes.messages;
        let count = messageRes.count;
        expect(messages.length).to.be.equal(config.pagesize);
        expect(count).to.be.equal(config.pagesize + 1);
      });
    });
  });
});
