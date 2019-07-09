<template lang="pug">
  div.list-view
    div.nav
      div.left
        div.button.create-discussion(@click="showEditor") {{ i18n('ui_create_discussion') }}
        category-list
      div.right
        div.unread-message(v-bind:style="{ height: unread !== 0 ? '60px' : '' }" @click="refresh") {{ i18n('ui_new_discussion_or_updates', { count: unread }) }}
        div.sort-order-and-tag-contorl
          div.drop-down-options-wrapper(v-if="sortBySelectorVisible")
            div.drop-down-options-container(style="width: 140px")
              div.drop-down-option(@click="toggleSortBySelectorValue('replyAt')")
                div.check-status(:class="{ checked: sortBy === 'replyAt' }")
                span 最新回复
              div.drop-down-option(@click="toggleSortBySelectorValue('createAt')")
                div.check-status(:class="{ checked: sortBy === 'createAt' }")
                span 最新创建
          button.button(@click="toggleSortBySelector($event)")
            span(v-if="sortBy === 'replyAt'") 最新回复
            span(v-if="sortBy === 'createAt'") 最新创建
            div.drop-down-icon
          //- button.tag(v-for="tag in tags" @click="selectTag(tag)" :class="{ active: tag === selectedTag }") {{ tag }}
          div(style="flex-grow: 1")
          button.tag-selector(@click="toggleTagFilter($event)") 标签筛选
            div.drop-down-icon
          div.drop-down-options-wrapper(v-if="tagFilterVisible" @click="$event.stopPropagation()")
            div.drop-down-options-container.align-right
              div.tag-filter
                div.tag(v-for="tag in tags")
                  input(type="checkbox" v-model="selectedTags[tag]")
                  span {{ tag }}
              div.tag-filter.extra-tags
                div.tag(v-for="tag in Object.keys(extraTags)")
                  input(type="checkbox" v-model="extraTags[tag]")
                  span {{ tag }}
              div.manual-input
                input.fake-input(type="checkbox")
                span.manual-input(role="button", @click="manualAddTag()") 手动输入标签
        discussion-list(v-show="!busy || currentPage > 1", :list="discussions", :key-prefix="currentSlug", :show-sticky="isIndex ? 'site' : 'category'", :on-tag-click="selectTag")
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
      sortBy: 'replyAt',
      unread: 0,
      selectedTags: {},
      extraTags: {},
      availableTags: [],
      sortBySelectorVisible: false,
      tagFilterVisible: false,
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
    tags () {
      return Object.keys(this.selectedTags);
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
    sortBy () {
      this.promise = this.$options.asyncData.call(this, { store: this.$store, route: this.$route });
    },
  },
  asyncData ({ store, route }) {
    let p;
    let tags = [];
    let sortBy = null;

    if (this && this.sortBy) {
      sortBy = this.sortBy;
    }

    if (this && this.checkoutTags) {
      tags = this.checkoutTags();
    }

    if (route.path === '/') {
      p = store.dispatch('fetchLatestDiscussions', { pagesize: config.discussionList.pagesize, tag: tags, sortBy });
    } else {
      p = store.dispatch('fetchDiscussionsUnderCategory', { slug: route.params.categorySlug, pagesize: config.discussionList.pagesize, tag: tags, sortBy });
    }
    return p;
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

      const tags = this.checkoutTags();

      if (this.$route.fullPath === '/') {
        return this.$store.dispatch('fetchLatestDiscussions', {
          page: this.currentPage,
          pagesize: config.discussionList.pagesize,
          tag: tags,
          append: true,
        });
      } else {
        return this.$store.dispatch('fetchDiscussionsUnderCategory', {
          slug: this.$route.params.categorySlug,
          page: this.currentPage,
          tag: tags,
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
      this.selectedTag = '';
      this.sortBy = 'replyAt';
      this.availableTags = [];
      if (!this.slug && this.$route.path === '/') {
        return this.$store.commit('setGlobalTitles', []);
      }
      let categoriesGroup = this.$store.state.categoriesGroup;
      for (let group of categoriesGroup) {
        for (let item of group.items) {
          if (item.type === 'category' && item.slug === this.slug) {
            this.$store.commit('setGlobalTitles', [item.name, item.description]);
            this.currentCategory = item.name;
            this.availableTags = item.tags || [];
            this.selectedTags = {};

            for (const tag of this.availableTags) {
              this.selectedTags[tag] = false;
            }
          }
        }
      }
    },
    refresh () {
      this.$options.asyncData.call(this, { store: this.$store, route: this.$route });
      this.unread = 0;
      // this.updateTitle();
    },
    selectTag (tag) {
      const $update = {};
      $update[tag] = true;

      if (this.selectedTags[tag] !== undefined && this.selectedTags[tag] !== true) {
        this.selectedTags = {
          ...this.selectedTags,
          ...$update,
        };
      } else {
        this.extraTags = {
          ...this.extraTags,
          ...$update,
        };
      }

      this.promise = this.$options.asyncData.call(this, { store: this.$store, route: this.$route });
    },
    manualAddTag () {
      this.$store.dispatch('showMessageBox', {
        type: 'INPUT',
        message: '输入标签以检索讨论：',
      }).then((input) => {
        const tag = input.trim();
        const $update = {};
        $update[tag] = true;

        this.extraTags = {
          ...this.extraTags,
          ...$update,
        };
      }).catch(() => {
      });
    },
    toggleSortBySelector (event) {
      if (!this.sortBySelectorVisible) {
        this.sortBySelectorVisible = true;

        event.stopPropagation();
        document.addEventListener('click', this.toggleSortBySelector);

        return;
      }

      document.removeEventListener('click', this.toggleSortBySelector);
      this.sortBySelectorVisible = false;
    },
    toggleTagFilter (event) {
      if (!this.tagFilterVisible) {
        this.tagFilterVisible = true;

        event.stopPropagation();
        document.addEventListener('click', this.toggleTagFilter);

        return;
      }

      document.removeEventListener('click', this.toggleTagFilter);
      this.tagFilterVisible = false;
      this.promise = this.$options.asyncData.call(this, { store: this.$store, route: this.$route });
    },
    toggleSortBySelectorValue (option) {
      this.sortBy = option;
    },
    checkoutTags () {
      let tags = [];

      if (this && this.selectedTags) {
        for (const tag of Object.keys(this.selectedTags)) {
          if (this.selectedTags[tag]) {
            tags.push(tag);
          }
        }
      }

      if (this && this.extraTags) {
        for (const tag of Object.keys(this.extraTags)) {
          if (this.extraTags[tag]) {
            tags.push(tag);
          }
        }
      }

      if (tags.length === 0) {
        tags = null;
      }

      return tags;
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

  div.sort-order-and-tag-contorl {
    padding: 1px;
    display: flex;
    flex-wrap: wrap;

    button {
      border: none;
      height: 36px;
      padding: 8px 12px;
      font-size: 13px;
      border-radius: 4px;
      color: mix($theme_color, white, 80%);
      background: mix($theme_color, white, 15%);
      margin-bottom: 5px;
      
    }

    div.drop-down-icon {
      background-image: url(../assets/drop-down.svg);
      display: inline-block;
      width: 11px;
      height: 11px;
      background-position: center;
      background-size: contain;
      margin-left: 5px;
      vertical-align: middle;
    }

    div.drop-down-options-wrapper {
      width: 0;
      height: 0;
      overflow: visible;
      align-self: flex-end;
      position: relative;
    }

    div.drop-down-options-container {
      height: auto;
      padding: 12px 0;
      background: white;
      position: relative;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      z-index: 20;
      border-radius: 4px;
      &.align-right {
        position: absolute;
        right: 0;
      }
    }

    div.drop-down-option {
      font-size: 14px;
      // text-align: center;
      line-height: 32px;
      cursor: pointer;

      &:hover {
        background-color: mix($theme_color, white, 10%);
      }
    }

    div.check-status {
      display: inline-block;
      width: 20px;
      height: 20px;
      background-position: center;
      background-size: contain;
      vertical-align: text-bottom;
      margin: 0 8px 0 8px;

      &.checked {
        background-image: url(../assets/check.svg);
      }
    }

    div.tag-filter {
      width: 300px;
      padding-left: 10px;
      padding-right: 10px;
      display: flex;
      flex-wrap: wrap;

      &.extra-tags {
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid mix($theme_color, white, 10%);
      }
    }

    div.tag {
      width: 150px;
      font-size: 14px;
    }

    div.manual-input {
      font-size: 14px;
      padding-left: 10px;
      margin-top: 2px;

      span.manual-input {
        cursor: pointer;
        color: $theme_color;
      }

      input.fake-input {
        opacity: 0;
      }
    }
  }

  button.tag {
    display: inline-block;
    font-size: 12px;
    height: 36px;
    padding: 6px 8px;
    margin-left: 10px;
    margin-bottom: 5px;
    border-radius: 4px;
    border: none;
    color: mix($theme_color, white, 80%);
    background: mix($theme_color, white, 10%);
    transition: all ease 0.2s;

    &.active {
      background: mix($theme_color, white, 70%);
      color: white;
    }
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
