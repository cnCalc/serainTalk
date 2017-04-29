import Vue from 'vue'
import VueRouter from 'vue-router'
import VueResource from 'vue-resource'
import Vuex from 'vuex'

import App from './components/App.vue'
import ListView from './components/ListView.vue'
import store from './store'

Vue.use(VueResource)
Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  routes: [
    { path: '/', component: ListView }
  ]
})

new Vue({
  el: '#app',
  router,
  store,
  render: h => h(App)
})
