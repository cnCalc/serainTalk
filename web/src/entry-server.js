import { createApp } from './app.js';
import axios from 'axios';
// import regeneratorRuntime from 'regenerator-runtime';

axios.defaults.baseURL = 'http://localhost:8000';
axios.interceptors.request.use(function (config) {
  config.headers = {
    'server-side-rendering': 'true',
  };
  return config;
}, function (error) {
  return Promise.reject(error);
});

export default context => new Promise((resolve, reject) => {
  createApp().then(({ app, store, router }) => {
    router.push(context.url);
    store.state.ssr = true;

    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents();

      if (!matchedComponents.length) {
        return reject({ code: 404 });
      }

      const componentsWithAsyncData = [];
      const checkComponent = C => {
        if (C.asyncData) {
          componentsWithAsyncData.push(C);
        }
        if (C.components) {
          Object.keys(C.components).forEach(name => {
            checkComponent(C.components[name]);
          });
        }
      };

      matchedComponents.forEach(C => {
        checkComponent(C);
      });

      Promise.all(componentsWithAsyncData.map(Component => {
        let promise = Component.asyncData.call(Component, {
          store,
          route: router.currentRoute,
        });
        return promise;
      })).then(() => {
        context.state = store.state;
        resolve(app);
      }).catch(error => {
        if (error.response.status === 404) {
          reject({ code: 404, url: '/not-found' });
        }
        reject(error);
      });
    }, reject);
  });
});
