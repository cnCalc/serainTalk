/*eslint no-return-assign: 0*/

import Vue from 'vue';
import Vuex from 'vuex';

import mutations from './mutations';
import actions from './actions';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    members: {},
    member: {
      discussions: [],
    },
    me: {},
    discussions: [],
    categoriesGroup: [],
    globalTitle: '',
    globalSubtitle: '',
    theme: window.localStorage['theme'] || 'light',
    busy: false,
    discussionMeta: {},
    discussionPosts: {},
    autoLoadOnScroll: window.localStorage['experimental-auto-load-on-scroll'] === 'on',
  },
  mutations,
  actions,
});
