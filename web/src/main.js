import Vue from 'vue'
import VueRouter from "vue-router"
import App from './App.vue'
import ListView from './ListView.vue'

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
  render: h => h(App)
})
