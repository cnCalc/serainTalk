import Vue from 'vue';
import { sync } from 'vuex-router-sync';
import axios from 'axios';

import App from './App.vue';

import './utils/ws-eventbus';
import i18n from './mixins/i18n';
import { createRouter } from './router';
import { createStore } from './store';

Vue.mixin(i18n);

axios.defaults.headers.common['cache-control'] = 'no-cache, must-revalidate, post-check=0, pre-check=0, max-age=0';
axios.defaults.headers.common['expires'] = '0';
axios.defaults.headers.common['expires'] = 'Tue, 01 Jan 1980 1:00:00 GMT';
axios.defaults.headers.common['pragma'] = 'no-cache';

Vue.mixin({
  beforeMount () {
    const { asyncData } = this.$options;
    if (asyncData && !this.$store.state.ssr) {
      this.dataPromise = asyncData.call(this, {
        store: this.$store,
        route: this.$route,
      });
    }
  },
});

export function createApp () {
  const router = createRouter();
  const store = createStore();

  sync(store, router);

  const app = new Vue({
    data () {
      return {
        eventBus: null,
      };
    },
    router,
    store,
    render: h => h(App),
  });

  return Promise.resolve({ app, router, store });
}
