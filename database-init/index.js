'use strict';

const db = require('../database');

exports = module.exports = {};

let init = async () => {
  await db.prepare();
  try {
    await db.generic.drop();
    console.log('generic dropd');
  } catch (err) { }
  await db.generic.insertMany([
    {
      key: 'pinned-categories',
      groups: [
        {
          name: '图形编程计算器讨论区',
          items: [
            {
              name: '德州仪器（TI）图形计算器',
              type: 'category',
              slug: 'ticalc',
              description: '德州仪器 Texas Instruments（TI）图形计算器、可编程计算器讨论。',
              color: '#888888',
              img: null
            },
            {
              name: '卡西欧（CASIO）图形计算器',
              type: 'category',
              slug: 'casiocalc',
              description: '卡西欧（CASIO）图形计算器、可编程计算器讨论。',
              color: '#888888',
              img: null
            },
            {
              name: '惠普（HP）图形计算器',
              type: 'category',
              slug: 'hpcalc',
              description: '惠普 Hewlett-Packard（HP）图形计算器、可编程计算器讨论。',
              color: '#888888',
              img: null
            },
            {
              name: '其他图形计算器',
              type: 'category',
              slug: 'othercalc',
              description: '其它可编程计算器，辉光、VFD、LED等古董计算器收藏、泛手持计算设备的讨论。',
              color: '#888888',
              img: null
            },
            {
              name: '图形计算器资源下载',
              type: 'category',
              slug: 'calcdownload',
              description: '提供各种图形以及可编程计算器的程序、模拟器、联机软件等下载。',
              color: '#888888',
              img: null
            },
            {
              name: 'ArithMax开源计算器项目',
              type: 'category',
              slug: 'arithmax',
              description: '',
              color: '#888888',
              img: null
            },
          ]
        }, {
          name: '函数计算器讨论区',
          items: [
            {
              name: '函数机综合讨论区',
              type: 'category',
              slug: 'scicalc',
              description: '函数科学计算器综合讨论区。',
              color: '#888888',
              img: null
            },
            {
              name: '硬升级与硬件讨论',
              type: 'category',
              slug: 'hardmod',
              description: '讨论函数计算器硬升级话题，也欢迎电子方面的讨论。',
              color: '#888888',
              img: null
            },
          ]
        }, {
          name: '非传统平台计算软件讨论区',
          items: [
            {
              name: '计算软件讨论及资源下载',
              type: 'category',
              slug: 'calcsoftware',
              description: '讨论各种计算机平台上的计算软件，如 Mathematica, Maple, MatLab 等，以及 Windows CE、Linux、Mac 等平台上的计算软件。',
              color: '#888888',
              img: null
            },
          ]
        }, {
          name: '杂类版块',
          items: [
            {
              name: '站务管理',
              type: 'category',
              slug: 'site',
              description: '意见、建议发表，系统问题报告',
              color: '#888888',
              img: null
            },
            {
              name: '二手&交易',
              type: 'category',
              slug: 'trade',
              description: '本区为计算器及周边物品交易专区，一切交易帖子请发在这里。',
              color: '#888888',
              img: null
            },
            {
              name: '聊天与贴图',
              type: 'category',
              slug: 'chat',
              description: '聊天之处，绝对禁止纯水。本区仅接受非技术性贴图。与计算器有关的图片请发表到相应的讨论区。',
              color: '#888888',
              img: null
            },
            {
              name: '学生学术讨论',
              type: 'category',
              slug: 'academic',
              description: '有关学生学习交流的板块|心得|研究|报告|讨论',
              color: '#888888',
              img: null
            },
          ]
        }, {
          name: '友情链接',
          items: [
            {
              name: 'TI-Planet',
              type: 'link',
              href: 'https://tiplanet.org/',
              description: 'Programmes et forum sur les calculatrices TI. 国外最活跃的TI社区之一（法语）',
              color: '#888888',
              img: null
            }, {
              name: '中山市中学教学网',
              type: 'link',
              href: 'http://www.gdzssx.com/',
              description: '广东中山市中学教育网，包含Nspire数学教学相关应用。',
              color: '#888888',
              img: null
            }, {
              name: 'TI测绘',
              type: 'link',
              href: 'http://www.ticehui.org/',
              description: '讨论TI计算器测绘应用的测绘论坛。包含问答、文章、程序、软件、教学等等部分。',
              color: '#888888',
              img: null
            }, {
              name: '测工网',
              type: 'link',
              href: 'http://www.cegong.com/',
              description: '',
              color: '#888888',
              img: null
            }, {
              name: 'Casiopeia',
              type: 'link',
              href: 'http://www.casiopeia.net/',
              description: '',
              color: '#888888',
              img: null
            },
          ]
        },
      ]
    },
    {
      key: 'permissions',
      permissions: require('../config/permissions')
    }
  ]);
  console.log('database initialization complete');
  // TODO: 如果是命令行启动自动退出
};
let initPromise = init();
exports.init = initPromise;

