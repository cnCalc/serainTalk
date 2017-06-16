import Vue from 'vue';
import VueRouter from 'vue-router';
import VueResource from 'vue-resource';
import Vuex from 'vuex';

import App from './components/App.vue';
import ListView from './components/ListView.vue';
import NotFound from './components/NotFound.vue';
import BadRequest from './components/BadRequest.vue';
import DiscussionView from './components/DiscussionView.vue';
import MemberView from './components/MemberView.vue';
import store from './store';

Vue.use(VueResource);
Vue.use(VueRouter);
Vue.use(Vuex);
Vue.http.interceptors.push((request, next) => {
  request.url += (request.url.indexOf('?') > 0 ? '&' : '?') + `__t=${new Date().getTime()}`;
  next();
});

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
      path: '/d/:discussionId/:index',
      component: DiscussionView,
      meta: { keepAlive: false },
    }, {
      path: '/m/:memberId',
      component: MemberView,
      meta: { keepAlive: false }
    }, {
      path: '/400',
      component: BadRequest,
    }, {
      path: '*',
      component: NotFound,
    }
  ],
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { x: 0, y: 0 };
    }
  },
});

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
});
