'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');
const config = require('../../config');

let agent = supertest.agent(require('../../index'));

describe('message part', async () => {
  before(async () => {
    await config.prepare();
  });

  it('send message.', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          content: 'hello, here is test message.',
        };
        let sendMessageRes = await agent.post(postUrl)
          .send(payload)
          .expect(201);
        sendMessageRes = sendMessageRes.body;
        let messageId = sendMessageRes.messageId;
        expect(sendMessageRes.status).to.be.equal('ok');
        expect(messageId).to.be.ok;

        let getUrl = `/api/v1/message/${messageId}`;

        let getMessageRes = await agent.get(getUrl).expect(200);
        getMessageRes = getMessageRes.body;
        let message = getMessageRes.message;
        expect(getMessageRes.status).to.be.equal('ok');
        expect(message._id).to.be.equal(messageId);
        expect(message.members).to.be.an('array');
        expect(message.members.length).to.be.equal(2);
        expect(message.members).includes(newMemberInfoA.id);
        expect(message.members).includes(newMemberInfoB.id);
        expect(message.timeline).to.be.an('array');
        expect(message.timeline[0].content).to.be.equal(payload.content);
        expect(message.timeline[0].date).to.be.ok;
        expect(message.timeline[0].from).to.be.equal(newMemberInfoB.id);
      });
    });
  });

  it('get message list', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          content: 'hello, here is test message.',
        };
        await agent.post(postUrl)
          .send(payload)
          .expect(201);
        let getUrl = '/api/v1/messages';
        let messageRes = await agent.get(getUrl)
          .expect(200);
        messageRes = messageRes.body;
        let messagesInfo = messageRes.messagesInfo;
        let count = messageRes.count;
        expect(messagesInfo).to.be.an('array');
        expect(messagesInfo[0]).to.be.ok;
        expect(messagesInfo[0]._id).to.be.ok;
        expect(messagesInfo[0].members).to.be.an('array');
        expect(messagesInfo[0].members.length).to.be.equal(2);
        expect(messagesInfo[0].members).includes(newMemberInfoA.id);
        expect(messagesInfo[0].members).includes(newMemberInfoB.id);
        expect(count).to.be.ok;
      });
    });
  });

  it('get message by memberId', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          content: 'hello, here is test message.',
        };
        for (let i = 0; i < config.pagesize + 1; i++) {
          await agent.post(postUrl)
            .send(payload)
            .expect(201);
        }
        let getUrl = `/api/v1/messages/member/${newMemberInfoA.id}`;
        let messageRes = await agent.get(getUrl)
          .expect(200);
        let message = messageRes.body.message;
        expect(message.timeline).to.be.an('array');
        expect(message.timeline.length).to.be.equal(config.pagesize);
        expect(Object.keys(message.timeline[0])).to.include.members(['from', 'date', 'content']);
      });
    });
  });

  it('get message by messageId', async () => {
    await testTools.member.createOneMember(agent, null, async (newMemberInfoA) => {
      await testTools.member.createOneMember(agent, null, async (newMemberInfoB) => {
        let postUrl = `/api/v1/message/${newMemberInfoA.id}`;
        let payload = {
          content: 'hello, here is test message.',
        };
        for (let i = 0; i < config.pagesize + 1; i++) {
          await agent.post(postUrl)
            .send(payload)
            .expect(201);
        }
        let getUrl = '/api/v1/messages';
        let messageRes = await agent.get(getUrl)
          .expect(200);
        let messageInfo = messageRes.body.messagesInfo[0];

        getUrl = `/api/v1/message/${messageInfo._id}`;
        messageRes = await agent.get(getUrl)
          .expect(200);
        let message = messageRes.body.message;
        expect(message.timeline).to.be.an('array');
        expect(message.timeline.length).to.be.equal(config.pagesize);
        expect(Object.keys(message.timeline[0])).to.include.members(['from', 'date', 'content']);
      });
    });
  });
});
