/*eslint camelcase: ["error", {properties: "never"}]*/

const translations = {
  'zh-cn': {
    // Discussion View
    ui_attachment_list: '附件列表',
    ui_created_at: '创建于 %date%',
    ui_edited_at: '，编辑于 %date%',
    ui_reply: '回复',
    ui_copy_link: '复制链接',
    ui_jump_to_bottom: '跳至末尾',
    ui_edit: '编辑',
    ui_delete: '删除',
    ui_undelete: '恢复',
    ui_new_replies_event: '%count% 条新回复，点击以查看',
    ui_no_post_to_show: '没有可展示的帖子',
    ui_quick_funcs: '快速操作',
    ui_qf_subscribe: '订阅更新',
    ui_qf_unsubscribe: '取消订阅',
    ui_qf_reply_to_post: '回复帖子',
    ui_qf_scroll_to_top: '回到顶部',
    ui_qf_lock_discussion: '锁定讨论',
    ui_qf_unlock_discussion: '解除锁定',
    ui_qf_delete_discussion: '删除讨论',

    // List View
    ui_create_discussion: '创建新帖',
    ui_new_discussion_or_updates: '%count% 个新讨论或帖子更新，点击以刷新。',
    ui_load_more: '加载更多',

    // Discussion List
    // ui_created_at: defined above
    ui_replied_at: '回复于 %date%',

    // Editor
    // Member Control
    link_my_page: '我的主页',
    link_mails: '站内消息',
    link_settings: '个人设置',
    link_switch_theme: '切换主题',
    link_sign_out: '退出登录',
  },
  'en-us': {
    // Discussion View
    ui_attachment_list: 'Attachment list',
    ui_created_at: 'created at %date%',
    ui_edited_at: ', last edited at %date%',
    ui_reply: 'Reply',
    ui_copy_link: 'Copy Link',
    ui_jump_to_bottom: 'Jump to bottom',
    ui_edit: 'Edit',
    ui_delete: 'Delete',
    ui_undelete: 'Undelete',
    ui_new_replies_event: '%count% new replies, click here to show.',
    ui_no_post_to_show: 'no post available for showing',
    ui_quick_funcs: 'Quick Functions',
    ui_qf_subscribe: 'Subscribe',
    ui_qf_unsubscribe: 'Unsubscribe',
    ui_qf_reply_to_post: 'Reply',
    ui_qf_scroll_to_top: 'Scroll to top',
    ui_qf_lock_discussion: 'Lock discussion',
    ui_qf_unlock_discussion: 'Unlock discussion',
    ui_qf_delete_discussion: 'Delede discussion',

    // List View
    ui_create_discussion: 'Start a Discussion',
    ui_new_discussion_or_updates: '%count% updates, click here to refresh',
    ui_load_more: 'Load More',

    // Discussion List
    // ui_created_at: defined above
    ui_replied_at: 'replied at %date%',

    // Member Control
    link_my_page: 'My Page',
    link_mails: 'Mails',
    link_settings: 'Settings',
    link_switch_theme: 'Theme',
    link_sign_out: 'Sign off',
  },
};

const internationalizationMixin = {
  methods: {
    i18n (key, params = {}) {
      // const locale = 'en-us';
      const locale = 'zh-cn';
      const template = (translations[locale] || {})[key];

      if (template === undefined) {
        console.warn(`Unknown ${locale} translations: ${key}`);
        return key;
      }

      return Object.keys(params).reduce((template, key) => {
        return template.replace(new RegExp(`%${key}%`, 'g'), params[key]);
      }, template);
    },
  },
};

export default internationalizationMixin;
