db.generic.remove({});
db.generic.insertMany([{
  key: 'pinned-categories',
  groups: [
    {
      name: '图形编程计算器讨论区',
      categories: [
        {
          name: '德州仪器（TI）图形计算器',
          slug: 'ticalc',
          description: '德州仪器 Texas Instruments（TI）图形计算器、可编程计算器讨论。',
          color: #888888,
          img: ''
        },
        {
          name: '卡西欧（CASIO）图形计算器',
          slug: 'casiocalc',
          description: '卡西欧（CASIO）图形计算器、可编程计算器讨论。',
          color: #888888,
          img: ''
        },
        {
          name: '惠普（HP）图形计算器',
          slug: 'hpcalc',
          description: '惠普 Hewlett-Packard（HP）图形计算器、可编程计算器讨论。',
          color: #888888,
          img: ''
        },
        {
          name: '其他图形计算器',
          slug: 'othercalc',
          description: '其它可编程计算器，辉光、VFD、LED等古董计算器收藏、泛手持计算设备的讨论。',
          color: #888888,
          img: ''
        },
        {
          name: '图形计算器资源下载',
          slug: 'calcdownload',
          description: '提供各种图形以及可编程计算器的程序、模拟器、联机软件等下载。',
          color: #888888,
          img: ''
        },
        {
          name: 'ArithMax开源计算器项目',
          slug: 'arithmax',
          description: '',
          color: #888888,
          img: ''
        },
      ]
    }, {
      name: '函数计算器讨论区',
      categories: [
        {
          name: '函数机综合讨论区',
          slug: 'scicalc',
          description: '函数科学计算器综合讨论区。',
          color: #888888,
          img: ''
        },
        {
          name: '硬升级与硬件讨论',
          slug: 'hardmod',
          description: '讨论函数计算器硬升级话题，也欢迎电子方面的讨论。',
          color: #888888,
          img: ''
        },
      ]
    }, {
      name: '非传统平台计算软件讨论区',
      categories: [
        {
          name: '计算软件讨论及资源下载',
          slug: 'calcsoftware',
          description: '讨论各种计算机平台上的计算软件，如 Mathematica, Maple, MatLab 等，以及 Windows CE、Linux、Mac 等平台上的计算软件。',
          color: #888888,
          img: ''
        },
      ]
    }, {
      name: '杂类版块',
      categories: [
        {
          name: '站务管理',
          slug: 'site',
          description: '意见、建议发表，系统问题报告',
          color: #888888,
          img: ''
        },
        {
          name: '二手&交易',
          slug: 'trade',
          description: '本区为计算器及周边物品交易专区，一切交易帖子请发在这里。',
          color: #888888,
          img: ''
        },
        {
          name: '聊天与贴图',
          slug: 'chat',
          description: '聊天之处，绝对禁止纯水。本区仅接受非技术性贴图。与计算器有关的图片请发表到相应的讨论区。',
          color: #888888,
          img: ''
        },
        {
          name: '学生学术讨论',
          slug: 'academic',
          description: '有关学生学习交流的板块|心得|研究|报告|讨论',
          color: #888888,
          img: ''
        },
      ]
    }
  ]
}]);