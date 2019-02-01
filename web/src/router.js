import Vue from 'vue';
import VueRouter from 'vue-router';

const ErrorView = () => import(/* webpackChunkName: "ErrorView" */ './views/ErrorView.vue');
const DiscussionView = () => import(/* webpackChunkName: "DiscussionView" */ './views/DiscussionView.vue');
const MemberView = () => import(/* webpackChunkName: "MemberView" */ './views/MemberView.vue');
const ListView = () => import(/* webpackChunkName: "ListView" */ './views/ListView.vue');
const SigninView = () => import(/* webpackChunkName: "SigninView" */ './views/SigninView.vue');
const SignupView = () => import(/* webpackChunkName: "SignupView" */ './views/SignupView.vue');
const MigrationView = () => import(/* webpackChunkName: "MigrationView" */ './views/MigrationView.vue');
const MessageView = () => import(/* webpackChunkName: "MessageView" */ './views/MessageView.vue');
const DiscuzRedirectView = () => import(/* webpackChunkName: "DiscuzRedirectView" */ './views/DiscuzRedirectView.vue');
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
        path: '/viewthread.php',
        component: DiscuzRedirectView,
      }, {
        path: '/thread-:tid-:extra-:page.html',
        component: DiscuzRedirectView,
      }, {
        path: '/forum.php',
        component: DiscuzRedirectView,
      }, {
        path: '/home.php',
        component: DiscuzRedirectView,
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
