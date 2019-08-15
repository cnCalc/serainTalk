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

const AvatarCutter = () => import(/* webpackChunkName: "AvatarCutterComponent" */ './components/AvatarCutter.vue');
const AccountSetting = () => import(/* webpackChunkName: "AccountSettingComponent" */ './components/AccountSetting.vue');
const RecentActivity = () => import(/* webpackChunkName: "RecentActivityComponent" */ './components/RecentActivity.vue');
const MemberRecentPosts = () => import(/* webpackChunkName: "MemberRecentPostsComponent" */ './components/MemberRecentPosts.vue');
const MemberSubscribedPosts = () => import(/* webpackChunkName: "MemberSubscribedPostsComponent" */ './components/MemberSubscribedPosts.vue');

Vue.use(VueRouter);

export function creatorouter (store) {
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
        beforeEnter (to, from, next) {
          const { state } = store;
          if (from.path !== to.path && state.me && state.me.settings && state.me.settings.preferNewTab) {
            window.open(to.fullPath);
            next(false);
          } else {
            next();
          }
        },
      }, {
        path: '/d/:discussionId/:page',
        component: DiscussionView,
        meta: { keepAlive: true },
        beforeEnter (to, from, next) {
          const { state } = store;
          if (from.params.discussionId !== to.params.discussionId && state.me && state.me.settings && state.me.settings.preferNewTab) {
            window.open(to.fullPath);
            next(false);
          } else {
            next();
          }
        },
      }, {
        path: '/m/:memberId',
        component: MemberView,
        meta: { keepAlive: true, mode: 'posts' },
        children: [{
          path: 'change-avatar',
          component: AvatarCutter,
          meta: { keepAlive: true },
        }, {
          path: 'settings',
          component: AccountSetting,
          meta: { keepAlive: true },
        }, {
          path: '',
          component: RecentActivity,
          meta: { keepAlive: true },
        }, {
          path: 'discussions',
          component: MemberRecentPosts,
          meta: { keepAlive: true },
        }, {
          path: 'subscribed',
          component: MemberSubscribedPosts,
          meta: { keepAlive: true },
        }],
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
        path: '/space-uid-:uid.html',
        component: DiscuzRedirectView,
      }, {
        path: '/forum.php',
        component: DiscuzRedirectView,
      }, {
        path: '/home.php',
        component: DiscuzRedirectView,
      }, {
        path: '/redirect.php',
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
