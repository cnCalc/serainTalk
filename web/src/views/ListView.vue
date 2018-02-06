<template lang="pug">
  div.list-view
    div.nav
      div.left
        div.button.create-discussion(@click="showEditor") 创建新帖
        category-list
      div.right
        discussion-list(v-show="!busy || currentPage > 1")
        loading-icon(v-if="busy")
        div.list-nav
          button.button.load-more(@click="loadMore", v-if="!busy") 加载更多
</template>

<script>
import DiscussionList from '../components/DiscussionList.vue';
import CategoryList from '../components/CategoryList.vue';
import LoadingIcon from '../components/LoadingIcon.vue';
import titleMixin from '../mixins/title.js';

export default {
  name: 'list-view',
  mixins: [titleMixin],
  components: {
    DiscussionList, CategoryList, LoadingIcon,
  },
  data () {
    return {
      currentPage: 1,
      currentSlug: '',
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
      return this.$store.state.discussions;
    },
    members () {
      return this.$store.state.members;
    },
    slug () {
      return this.$route.path === '/' ? '' : this.$route.params.categorySlug;
    },
  },
  title () {
    if (!this.slug && this.$route.path === '/') {
      return '首页';
    }
    let categoriesGroup = this.$store.state.categoriesGroup;
    for (let group of categoriesGroup) {
      for (let item of group.items) {
        if (item.type === 'category' && item.slug === this.slug) {
          return item.name;
        }
      }
    }
  },
  methods: {
    loadMore () {
      this.currentPage++;
      if (this.$route.fullPath === '/') {
        return this.$store.dispatch('fetchLatestDiscussions', {
          page: this.currentPage,
          append: true,
        });
      } else {
        return this.$store.dispatch('fetchDiscussionsUnderCategory', {
          slug: this.$route.params.categorySlug,
          page: this.currentPage,
          append: true,
        });
      }
    },
    showEditor () {
      this.$store.commit('updateEditorDisplay', 'show');
      this.$store.commit('updateEditorMode', { mode: 'CREATE_DISCUSSION' });
    },
    flushGlobalTitles () {
      if (!this.slug && this.$route.path === '/') {
        return this.$store.commit('setGlobalTitles', []);
      }
      let categoriesGroup = this.$store.state.categoriesGroup;
      for (let group of categoriesGroup) {
        for (let item of group.items) {
          if (item.type === 'category' && item.slug === this.slug) {
            this.$store.commit('setGlobalTitles', [item.name, item.description]);
          }
        }
      }
    },
  },
  watch: {
    '$route': function (route) {
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
      this.$options.asyncData.call(this, { store: this.$store, route: this.$route });
    },
    slug: function (slug) {
      this.flushGlobalTitles();
    },
    categoriesGroup () {
      this.flushGlobalTitles();
    },
  },
  activated () {
    // this.flushGlobalTitles();
    this.updateTitle();
  },
  created () {
    this.currentSlug = this.slug || '';
  },
  asyncData ({ store, route }) {
    let p;
    if (route.path === '/') {
      p = store.dispatch('fetchLatestDiscussions');
    } else {
      p = store.dispatch('fetchDiscussionsUnderCategory', { slug: route.params.categorySlug });
    }
    return p.then(() => {
      this.updateTitle();
    });
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
