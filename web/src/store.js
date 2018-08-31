/*eslint no-return-assign: 0*/

import Vue from 'vue';
import Vuex from 'vuex';

import mutations from './store/mutations';
import actions from './store/actions';

Vue.use(Vuex);

export function createStore () {
  const store = new Vuex.Store({
    state: {
      members: {},
      member: {
        discussions: [],
      },
      me: {},
      discussions: [],
      categoriesGroup: [],
      globalTitle: {
        title: '',
        subtitle: '',
        isMobileMemberView: false,
      },
      category: {},
      // FIXME:
      theme: /* window.localStorage['theme'] || */'light',
      busy: false,
      discussionMeta: {},
      discussionPosts: {},
      editor: {
        mode: 'CREATE_DISCUSSION',
        discussionId: null,
        memberId: null,
        display: 'none',
        index: 0,
      },
      messageBox: {
        type: null,
        title: '',
        message: '',
        promise: null,
      },
      settings: {},
      notifications: {},
      messageSession: null,
      attachments: {},
      autoLoadOnScroll: true,
    },
    mutations,
    actions,
  });

  return store;
}

// FIXME:
// export default createStore();
