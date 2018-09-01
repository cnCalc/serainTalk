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
    this.updateTitle();
  },
  activated () {
    this.isActive = true;
    this.updateTitle();
  },
  deactivated () {
    this.isActive = false;
  },
  methods: {
    updateTitle () {
      const getAndSetTitle = function () {
        const title = getTitle(this);
        if (title) {
          document.title = `${title} - ${config.title}`;
        }
      }.bind(this);

      this.$nextTick(() => {
        const promise = Promise.all([this.promise, this.dataPromise]);
        if (promise) {
          promise.then(() => {
            getAndSetTitle();
          });
        } else {
          getAndSetTitle();
        }
      });
    },
  },
  watch: {
    '$route': function () {
      if (!this.isActive) {
        return;
      }
      this.updateTitle();
    },
  },
};

export default process.env.VUE_ENV === 'server'
  ? serverTitleMixin
  : clientTitleMixin;
