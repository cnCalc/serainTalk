import Vue from 'vue';
import VueRouter from 'vue-router';

import ErrorView from './views/ErrorView.vue';
import DiscussionView from './views/DiscussionView.vue';
import MemberView from './views/MemberView.vue';
import ListView from './views/ListView.vue';
import SigninView from './views/SigninView.vue';
import SignupView from './views/SignupView.vue';
import MigrationView from './views/MigrationView.vue';
import MessageView from './views/MessageView.vue';

Vue.use(VueRouter);

export function createRouter () {
  return new VueRouter({
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
}
