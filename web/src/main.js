import Vue from 'vue';
import VueRouter from 'vue-router';
import { sync } from 'vuex-router-sync';
import axios from 'axios';

import App from './App.vue';
import store from './store';

import ErrorView from './views/ErrorView.vue';
import DiscussionView from './views/DiscussionView.vue';
import MemberView from './views/MemberView.vue';
import ListView from './views/ListView.vue';
import SigninView from './views/SigninView.vue';
import SignupView from './views/SignupView.vue';
import MigrationView from './views/MigrationView.vue';
import MessageView from './views/MessageView.vue';

import './utils/ws-eventbus';
import i18n from './mixins/i18n';

Vue.mixin(i18n);
Vue.use(VueRouter);

axios.defaults.headers.common['cache-control'] = 'no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0';
axios.defaults.headers.common['expires'] = '0';
axios.defaults.headers.common['expires'] = 'Tue, 01 Jan 1980 1:00:00 GMT';
axios.defaults.headers.common['pragma'] = 'no-cache';

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: ListView,
      meta: { keepAlive: true },
    }, {
      path: '/c/:categorySlug',
      component: ListView,
      meta: { keepAlive: true },
    }, {
      path: '/d/:discussionId',
      component: DiscussionView,
      meta: { keepAlive: true },
    }, {
      path: '/d/:discussionId/:page',
      component: DiscussionView,
      meta: { keepAlive: true },
    }, {
      path: '/m/:memberId',
      component: MemberView,
      meta: { keepAlive: true, mode: 'posts' },
    }, {
      path: '/m/:memberId/discussions',
      component: MemberView,
      meta: { keepAlive: true, mode: 'discussions' },
    }, {
      path: '/m/:memberId/settings',
      component: MemberView,
      meta: { keepAlive: true, mode: 'settings' },
    }, {
      path: '/m/:memberId/change-avatar',
      component: MemberView,
      meta: { keepAlive: true, mode: 'avatar' },
    }, {
      path: '/signin',
      component: SigninView,
    }, {
      path: '/signup',
      component: SignupView,
    }, {
      path: '/migration',
      component: MigrationView,
    }, {
      path: '/migration/final',
      component: MigrationView,
      meta: { step: 'setUpNewInfo' },
    }, {
      path: '/message',
      component: MessageView,
    }, {
      path: '/message/:messageId',
      component: MessageView,
    }, {
      path: '/message/new/:memberId',
      component: MessageView,
      meta: { newSession: true },
    }, {
      path: '/400',
      component: ErrorView,
      meta: { code: 400 },
    }, {
      path: '*',
      component: ErrorView,
      meta: { code: 404 },
    },
  ],
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else if (to.path.indexOf('/d') === 0 && from.path.indexOf('/d') === 0) {
      return undefined;
    } else {
      return { x: 0, y: 0 };
    }
  },
});

Vue.mixin({
  beforeMount () {
    const { asyncData } = this.$options;
    if (asyncData) {
      this.dataPromise = asyncData.call(this, {
        store: this.$store,
        route: this.$route,
      });
    }
  },
});

sync(store, router);

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App),
});
