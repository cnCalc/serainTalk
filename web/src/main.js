import Vue from 'vue';
import VueRouter from 'vue-router';
import VueResource from 'vue-resource';
import { sync } from 'vuex-router-sync';

import App from './components/App.vue';
import store from './store';

import ErrorView from './views/ErrorView.vue';
import DiscussionView from './views/DiscussionView.vue';
import MemberView from './views/MemberView.vue';
import ListView from './views/ListView.vue';

Vue.use(VueResource);
Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: ListView,
      meta: { keepAlive: true }
    }, {
      path: '/c/:categorySlug',
      component: ListView,
      meta: { keepAlive: true }
    }, {
      path: '/d/:discussionId',
      component: DiscussionView,
      meta: { keepAlive: false },
    }, {
      path: '/d/:discussionId/:page',
      component: DiscussionView,
      meta: { keepAlive: false },
    }, {
      path: '/m/:memberId',
      component: MemberView,
      meta: { keepAlive: true }
    }, {
      path: '/400',
      component: ErrorView,
      meta: { code: 400 },
    }, {
      path: '*',
      component: ErrorView,
      meta: { code: 404 },
    }
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
      this.dataPromise = asyncData({
        store: this.$store,
        route: this.$route
      });
    }
  }
});

sync(store, router);

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
});
