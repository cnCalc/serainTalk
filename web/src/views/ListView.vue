<template lang="pug">
  div.list-view
    div.nav
      div.left
        div.button.create-discussion(@click="showEditor") {{ i18n('ui_create_discussion') }}
        category-list
      div.right
        div.unread-message(v-bind:style="{ height: unread !== 0 ? '60px' : '' }" @click="refresh") {{ i18n('ui_new_discussion_or_updates', { count: unread }) }}
        div.sort-order-and-tag-contorl
        discussion-list(v-show="!busy || currentPage > 1", :list="discussions", :key-prefix="currentSlug", :show-sticky="isIndex ? 'site' : 'category'")
        div.list-nav
          loading-icon(v-if="busy", :no-padding-top="currentPage != 1")
          button.button.load-more(@click="loadMore", v-show="!busy && canLoadMore") {{ i18n('ui_load_more') }}
</template>

<script>
import DiscussionList from '../components/DiscussionList.vue';
import CategoryList from '../components/CategoryList.vue';
import LoadingIcon from '../components/LoadingIcon.vue';
import titleMixin from '../mixins/title.js';
import config from '../config';

// import bus from '../utils/ws-eventbus';

export default {
  name: 'ListView',
  components: {
    DiscussionList, CategoryList, LoadingIcon,
  },
  mixins: [titleMixin],
  data () {
    return {
      currentPage: 1,
      currentSlug: '',
      currentCategory: '',
      unread: 0,
    };
  },
  computed: {
    categoriesGroup () {
      return this.$store.state.categoriesGroup;
    },
    busy () {
      return this.$store.state.busy;
    },
    discussions () {
      if (this.slug === undefined) {
        if (this.currentSlug) {
          return this.$store.state.category.discussions;
        } else {
          return this.$store.state.discussions;
        }
      } else if (this.slug === '') {
        return this.$store.state.discussions;
      } else {
        return this.$store.state.category.discussions;
      }
    },
    members () {
      return this.$store.state.members;
    },
    slug () {
      return this.$route.path === '/' ? '' : this.$route.params.categorySlug;
    },
    isIndex () {
      return !this.slug;
    },
    canLoadMore () {
      return this.currentPage * config.discussionList.pagesize === this.discussions.length;
    },
  },
  title () {
    let base = '';
    if (this.unread) {
      base = `(${this.unread}) `;
    }

    if (!this.slug && this.$route.path === '/') {
      base += '首页';
    } else {
      base += this.$store.state.category.categoryName;
    }

    return base;
  },
  watch: {
    '$route': function (route) {
      this.unread = 0;
      if (typeof this.slug === 'undefined') {
        return;
      }
      if (this.$route.path === '/' && this.currentSlug === '' && this.$route.fullPath !== '/?refresh') {
        return;
      }
      if (this.currentSlug === route.params.categorySlug) {
        return;
      }

      this.currentSlug = this.slug;
      this.currentPage = 1;

      if (this.$route.query.refresh === null) {
        this.$nextTick(() => { this.$router.replace('/'); });
      }

      this.flushGlobalTitles();
      this.promise = this.$options.asyncData.call(this, { store: this.$store, route: this.$route });
    },
    slug: function (slug) {
      this.flushGlobalTitles();
    },
    categoriesGroup () {
      this.flushGlobalTitles();
    },
  },
  asyncData ({ store, route }) {
    let p;
    if (route.path === '/') {
      p = store.dispatch('fetchLatestDiscussions', { pagesize: config.discussionList.pagesize });
    } else {
      p = store.dispatch('fetchDiscussionsUnderCategory', { slug: route.params.categorySlug, pagesize: config.discussionList.pagesize });
    }
    return p.then(() => {
      // FIXME:
      // if (// this.updateTitle) {
      //   // this.updateTitle();
      // }
    });
  },
  activated () {
    this.flushGlobalTitles();
    // this.updateTitle();
    this.bus.$on('event', e => {
      if (((this.currentCategory !== '' && this.currentCategory === e.affects.category) || this.currentCategory === '') && (e.eventType === 'Create' || e.eventType === 'Update')) {
        this.unread++;
        // this.updateTitle();
      }
    });
  },
  created () {
    this.currentSlug = this.slug || '';
  },
  methods: {
    loadMore () {
      this.currentPage++;

      if (this.$route.fullPath === '/') {
        return this.$store.dispatch('fetchLatestDiscussions', {
          page: this.currentPage,
          pagesize: config.discussionList.pagesize,
          append: true,
        });
      } else {
        return this.$store.dispatch('fetchDiscussionsUnderCategory', {
          slug: this.$route.params.categorySlug,
          page: this.currentPage,
          pagesize: config.discussionList.pagesize,
          append: true,
        });
      }
    },
    showEditor () {
      if (!this.$store.state.me || this.$store.state.me._id === undefined) {
        return this.bus.$emit('notification', {
          type: 'error',
          body: '游客无法执行此操作，请登录后继续。',
        });
      }

      this.$store.commit('updateEditorDisplay', 'show');
      this.$store.commit('updateEditorMode', { mode: 'CREATE_DISCUSSION' });
    },
    flushGlobalTitles () {
      this.currentCategory = '';
      if (!this.slug && this.$route.path === '/') {
        return this.$store.commit('setGlobalTitles', []);
      }
      let categoriesGroup = this.$store.state.categoriesGroup;
      for (let group of categoriesGroup) {
        for (let item of group.items) {
          if (item.type === 'category' && item.slug === this.slug) {
            this.$store.commit('setGlobalTitles', [item.name, item.description]);
            this.currentCategory = item.name;
          }
        }
      }
    },
    refresh () {
      this.$options.asyncData.call(this, { store: this.$store, route: this.$route });
      this.unread = 0;
      // this.updateTitle();
    },
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';
@import '../styles/load-more-button.scss';

div.nav {
  display: flex;
  vertical-align: top;
  padding: 16px;
  @include respond-to(phone) {
    padding: 8px;
  }

  div.left {
    vertical-align: top;
    order: 1;
    flex-grow: 0;
    flex-shrink: 0;
    width: 220px;

    @include respond-to(phone) {
      display: none;
    }
  }

  div.right {
    vertical-align: top;
    display: inline-block;
    order: 2;
    flex-grow: 1;
    flex-shrink: 1;
    text-align: left;
    overflow: hidden;
  }

  div.create-discussion {
    width: 90%;
    margin-left: 0%;
    color: white;
  }

  div.unread-message {
    line-height: 60px;
    font-size: 1.1em;
    text-align: center;
    height: 0px;
    overflow: hidden;
    color: grey;
    cursor: pointer;
    transition: height ease 0.2s;
  }

  div.list-nav {
    height: 50px;
  }
}

.light-theme div.nav {
  div.create-discussion {
    background-color: $theme_color;
    color: white;
  }

  div.button:hover {
    background-color: darken($theme_color, 7%);
  }
}

.dark-theme div.nav {
  div.create-discussion {
    background-color: #444;
    color: white;
  }

  div.button:hover {
    background-color: #666;
  }
}

</style>
