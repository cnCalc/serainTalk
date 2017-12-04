'use strict';

const supertest = require('supertest');
const expect = require('chai').expect;
const testTools = require('../testTools');

let agent = supertest.agent(require('../../index'));

describe('debug part.', async () => {
  it('sudo in mocha.', async () => {
    let env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'MOCHA';
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let sudoUrl = '/api/v1/debug/sudo';
      let sudoRes = await agent.post(sudoUrl).expect(410);
      expect(sudoRes.header['set-cookie']).to.not.be.ok;
    });
    process.env.NODE_ENV = env;
  });

  it('sudo in procduct.', async () => {
    let env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'PROCDUCT';
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let sudoUrl = '/api/v1/debug/sudo';
      let sudoRes = await agent.post(sudoUrl).expect(410);
      expect(sudoRes.header['set-cookie']).to.not.be.ok;
    });
    process.env.NODE_ENV = env;
  });

  it('sudo in dev.', async () => {
    let env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'DEV';
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let sudoUrl = '/api/v1/debug/sudo';
      let sudoRes = await agent.post(sudoUrl).expect(201);
      expect(sudoRes.body.status).to.equal('ok');
      expect(sudoRes.header['set-cookie']).to.be.ok;
    });
    process.env.NODE_ENV = env;
  });

  it('notify in dev.', async () => {
    let env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'DEV';
    await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
      let sudoUrl = `/api/v1/debug/notification/${newMemberInfo.id}`;
      let payload = {
        content: 'just test',
        href: 'cncalc.org'
      };
      let sudoRes = await agent.post(sudoUrl).send(payload).expect(201);
      expect(sudoRes.body.status).to.equal('ok');
    });
    process.env.NODE_ENV = env;
  });
});
