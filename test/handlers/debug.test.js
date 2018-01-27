// 'use strict';

// const supertest = require('supertest');
// const expect = require('chai').expect;
// const testTools = require('../testTools');
// const utils = require('../../utils');

// let agent = supertest.agent(require('../../index'));

// describe('debug part.', async () => {
//   it('sudo in mocha.', async () => {
//     let env = process.env.NODE_ENV;
//     process.env.NODE_ENV = 'MOCHA';
//     await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
//       let sudoUrl = '/api/v1/debug/sudo';
//       let sudoRes = await agent.post(sudoUrl).expect(410);
//       expect(sudoRes.header['set-cookie']).to.not.be.ok;

//       let adminUrl = '/api/v1/debug/isadmin';
//       let adminRes = await agent.get(adminUrl);
//       expect(adminRes.body.isAdmin).to.not.be.ok;
//     });
//     process.env.NODE_ENV = env;
//   });

//   it('sudo in product.', async () => {
//     let env = process.env.NODE_ENV;
//     process.env.NODE_ENV = 'PRODUCT';
//     await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
//       let sudoUrl = '/api/v1/debug/sudo';
//       let sudoRes = await agent.get(sudoUrl).expect(410);
//       expect(sudoRes.header['set-cookie']).to.not.be.ok;

//       let adminUrl = '/api/v1/debug/isadmin';
//       let adminRes = await agent.get(adminUrl);
//       expect(adminRes.body.isAdmin).to.not.be.ok;
//     });
//     process.env.NODE_ENV = env;
//   });

//   it('sudo in dev.', async () => {
//     let env = process.env.NODE_ENV;
//     process.env.NODE_ENV = 'DEV';
//     await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
//       let sudoUrl = '/api/v1/debug/sudo';
//       let sudoRes = await agent.get(sudoUrl).expect(201);
//       expect(sudoRes.body.status).to.equal('ok');
//       expect(sudoRes.header['set-cookie']).to.be.ok;

//       let adminUrl = '/api/v1/debug/isadmin';
//       let adminRes = await agent.get(adminUrl);
//       expect(adminRes.body.isAdmin).to.be.ok;

//       let loginUrl = '/api/v1/member/login';
//       await agent
//         .post(loginUrl)
//         .send({
//           name: newMemberInfo.username,
//           password: newMemberInfo.password,
//         })
//         .expect(201);
//       adminUrl = '/api/v1/debug/isadmin';
//       adminRes = await agent.get(adminUrl);
//       expect(adminRes.body.isAdmin).to.not.be.ok;
//     });
//     process.env.NODE_ENV = env;
//   });

//   it('rollback permission in dev.', async () => {
//     let env = process.env.NODE_ENV;
//     process.env.NODE_ENV = 'DEV';
//     await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
//       let sudoUrl = '/api/v1/debug/sudo';
//       let sudoRes = await agent.get(sudoUrl).expect(201);
//       expect(sudoRes.body.status).to.equal('ok');
//       expect(sudoRes.header['set-cookie']).to.be.ok;
//     });
//     process.env.NODE_ENV = env;
//   });

//   it('notify in dev.', async () => {
//     let env = process.env.NODE_ENV;
//     process.env.NODE_ENV = 'DEV';
//     await testTools.member.createOneMember(agent, null, async (newMemberInfo) => {
//       let notificationUrl = `/api/v1/debug/notification/${newMemberInfo.id}`;
//       let payload = {
//         content: 'just test',
//         href: 'cncalc.org',
//       };
//       notificationUrl = utils.url.createRESTfulUrl(notificationUrl, payload);
//       let sudoRes = await agent.get(notificationUrl).send(payload).expect(201);
//       expect(sudoRes.body.status).to.equal('ok');
//     });
//     process.env.NODE_ENV = env;
//   });
// });
