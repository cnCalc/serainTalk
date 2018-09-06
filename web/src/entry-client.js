import Vue from 'vue';
import { createApp } from './app.js';
import { createWsEventBus } from './utils/ws-eventbus';

Vue.mixin({
  computed: {
    bus () {
      return this.$root.eventBus;
    },
  },
});

createApp().then(({ app, store, router }) => {
  if (window.__INITIAL_STATE__) {
    store.replaceState(window.__INITIAL_STATE__);
  }

  const wsEventBus = createWsEventBus(store);
  app.$root.eventBus = wsEventBus;

  router.onError((error) => {
    console.log(error);
    app.$forceUpdate();
    router.replace('/not-found');
  });

  router.onReady(() => {
    // router.beforeEach((to, from, next) => {
    //   if (store.state.forceReload) {
    //     window.location.href = to.fullPath;
    //   } else {
    //     next();
    //   }
    // });

    router.beforeResolve((to, from, next) => {
      if (store.state.ssr) {
        store.state.ssr = false;
      }
      return next();
    });

    app.$mount('#app');
  });
});
