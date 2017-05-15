import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import Vuex from 'vuex'

import App from './components/App.vue'
import ListView from './components/ListView.vue'
import NotFound from './components/NotFound.vue'
import store from './store'

Vue.use(VueResource)
Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    {
      path: '/',
      component: ListView,
      meta: {keepAlive: true}
    }, {
      path: '/c/:categorySlug',
      component: ListView,
      meta: {keepAlive: true}
    }, { 
      path: '*', 
      component: NotFound
    }
  ],
  scrollBehavior (to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { x: 0, y: 0 };
    }
  },
})

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
