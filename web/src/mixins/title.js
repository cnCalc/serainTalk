import config from '../config';

function getTitle (vm) {
  const { title } = vm.$options;
  if (title) {
    return typeof title === 'function'
      ? title.call(vm)
      : title;
  }
}

const serverTitleMixin = {
  created () {
    const title = getTitle(this);
    if (title) {
      this.$ssrContext.title = `${title} - ${config.title}`;
    }
  },
};

const clientTitleMixin = {
  data () {
    return {
      isActive: false,
    };
  },
  mounted () {
    const title = getTitle(this);
    if (title) {
      document.title = `${title} - ${config.title}`;
    }
  },
  activated () {
    this.isActive = true;
    const updateTitle = function () {
      const title = getTitle(this);
      if (title) {
        document.title = `${title} - ${config.title}`;
      }
    }.bind(this);

    this.$nextTick(() => {
      const promise = Promise.all([this.promise, this.dataPromise]);
      console.log(promise);
      if (promise) {
        promise.then(() => {
          updateTitle();
        });
      } else {
        updateTitle();
      }
    });
  },
  deactivated () {
    this.isActive = false;
  },
  watch: {
    '$route': function () {
      if (!this.isActive) {
        return;
      }
      const updateTitle = function () {
        const title = getTitle(this);
        if (title) {
          document.title = `${title} - ${config.title}`;
        }
      }.bind(this);

      this.$nextTick(() => {
        const promise = Promise.all([this.promise, this.dataPromise]);
        console.log(promise);
        if (promise) {
          promise.then(() => {
            updateTitle();
          });
        } else {
          updateTitle();
        }
      });
    },
  },
};

export default process.env.VUE_ENV === 'server'
  ? serverTitleMixin
  : clientTitleMixin;
