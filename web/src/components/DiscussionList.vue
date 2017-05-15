<template lang="pug">
  div.discussion-list
    ul
      li.discussion-list-item(v-for="discussion in discussions")
        div.avater 头
        div.discussion-meta
          h3.discussion-title {{ discussion.title }}
          span.discussion-last-reply 最后回复于 {{ new Date(discussion.lastDate * 1000).toLocaleDateString() }}
          span.discussion-tags wtmsb
          span.discussion-tags jbdxbl
    loading-icon(v-if="busy")
    div.discussion-page-nav
      div.discussion-button(@click="loadMore", v-if="!busy") 加载更多
</template>

<script>
import LoadingIcon from './LoadingIcon.vue';

import config from '../config';
import store from '../store';

export default {
  name: 'discussion-list',
  components: {
    LoadingIcon
  },
  data () {
    return {
      discussions: [],
      currentPage: 1,
      slug: '',
      busy: true,
    }
  },
  computed: {
    selectedCategory() {
      if (this.$route.fullPath === '/') {
        return '';
      }
      return this.$route.params.categorySlug
    },
    categoriesGroup() {
      return store.state.categoriesGroup;
    }
  },
  methods: {
    loadDiscussionList() {
      this.currentPage = 1;
      this.slug = this.selectedCategory;
      let url;
      if (this.slug === '') {
        url = `${config.api.url}${config.api.version}/discussions/latest?page=${this.currentPage}`;
      } else {
        url = `${config.api.url}${config.api.version}/category/${this.slug}/discussions?page=${this.currentPage}`;
      }
      this.busy = true;
      this.discussions = [];
      this.$http.get(url).then(res => {
        this.discussions = res.body.discussions;
        this.busy = false;
      })
    },
    updateListView() {
      if (!this.selectedCategory) {
        return;
      }
      let categoriesGroup = store.state.categoriesGroup;
      for (let group of categoriesGroup) {
        for (let category of group.categories) {
          if (category.slug === this.selectedCategory) {
            this.$parent.setNameAndDescription(category.name, category.description);
          }
        }
      }
    },
    loadMore() {
      this.busy = true;
      this.currentPage++;
      let url;
      if (this.slug === '') {
        url = `${config.api.url}${config.api.version}/discussions/latest?page=${this.currentPage}`;
      } else {
        url = `${config.api.url}${config.api.version}/category/${this.slug}/discussions?page=${this.currentPage}`;
      }
      this.$http.get(url).then(res => {
        this.discussions = [...this.discussions, ...res.body.discussions];
        this.busy = false;
      })
    }
  },
  watch: {
    selectedCategory: function(val, oldval) {
      if (typeof val === "undefined" || typeof oldval === "undefined") {
        return;
      }
      this.loadDiscussionList();
      this.updateListView();
    },
    categoriesGroup: function() {
      this.updateListView();
    }
  },
  created() {
    this.loadDiscussionList();
  }
}
</script>

<style lang="scss">
@import '../styles/global.scss';

div.discussion-list {
  padding-bottom: 20px;
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    li.discussion-list-item {
      display: block;
      padding: 12px;
    }
  }

  li.discussion-list-item {
    transition: background ease 0.2s;
    border-radius: 4px;
  }

  li.discussion-list-item:hover {
    background-color: mix($theme_color, white, 15%);
  }

  div.avater {
    display: inline-block;
    margin: 3px;
    width: 38px;
    height: 38px;
    line-height: 38px;
    text-align: center;
    border-radius: 19px;
    background-color: mix($theme_color, white, 80%);
    color: white;
    cursor: pointer;
  }

  div.discussion-meta {
    display: inline-block;
    padding-left: 12px;
    vertical-align: top;
    cursor: pointer;
  }

  h3.discussion-title {
    font-weight: normal;
    font-size: 16px;
    margin: 0;
  }

  span.discussion-last-reply {
    line-height: 24px;
    font-size: 12px;
  }

  span.discussion-tags {
    margin-left: 0.4em;
    font-size: 12px;
    background: mix($theme_color, white, 15%);
    color: mix($theme_color, white, 90%);
    font-weight: bold;
    border-radius: 4px;
    padding: 3px;
    transition: background ease 0.2s;
  }

  span.discussion-tags:hover {
    background: mix($theme_color, white, 30%);
  }

  div.discussion-button {
    margin: 10px auto 0 auto;
    font-size: 0.8em;
    width: 60px;
    line-height: 16px;
    border-radius: 4px;
    color: mix($theme_color, black, 90%);
    background: mix($theme_color, white, 15%);
    text-align: center; 
    padding: 6px;
    transition: all ease 0.1s;
    cursor: pointer;
  }

  div.discussion-page-nav {
    padding-top: 4px;
  }

  div.discussion-button:hover {
    color: mix($theme_color, black, 60%);
    background: mix($theme_color, white, 25%);
  }
}
</style>
