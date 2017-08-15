<template lang="pug">
  div.discussion-list
    ul: transition-group(name="list")
      li(v-for="discussion in discussions" :key="discussion._id"): div.discussion-list-item
        router-link.discussion-avatar(:to="'/m/' + discussion.creater")
          div.avater
            div.avatar-image(v-bind:style="{ backgroundImage: 'url(' + getMemberAvatarUrl(discussion.creater) + ')'}")
            div.avatar-fallback {{ (members[discussion.creater].username || '?').substr(0, 1).toUpperCase() }}
          div.creater-info-popup
            div.triangle-left
            span {{ members[discussion.creater].username || 'undefined' }} 发布于 {{ new Date(discussion.createDate * 1000).toLocaleDateString() }}
        div.discussion-meta
          h3.discussion-title
            router-link(:to="'/d/' + discussion._id") {{ decodeHTML(discussion.title) }}
          div.discussion-meta-other
            span.discussion-last-reply
              router-link(:to="'/m/' + discussion.lastMember")
                span.discussion-user {{ members[discussion.lastMember].username || 'undefined' }} 
              |{{ discussion.replies === 1 ? '发布于' : ( discussion.replies === 2 ? '回复于' : `等 ${discussion.replies - 1} 人回复于` ) }}{{ timeAgo(discussion.lastDate) }}
            span.discussion-tags(v-for="tag in discussion.tags") {{ tag }}
            span.discussion-tags 假装有tag
        div.discussion-meta-right
          span.discussion-category(v-if="slug === ''") {{ discussion.category }}
    loading-icon(v-if="busy")
    div.discussion-page-nav
      div.discussion-button(@click="loadMore", v-if="!busy") 加载更多
</template>

<script>
import LoadingIcon from './LoadingIcon.vue';

import config from '../config';
import store from '../store';

import { timeAgo } from '../utils/filters';
import decodeHTML from '../utils/decodeHTML';

export default {
  name: 'discussion-list',
  components: {
    LoadingIcon
  },
  data () {
    return {
      discussions: [],
      members: {},
      currentPage: 1,
      slug: '',
      busy: true,
    };
  },
  computed: {
    selectedCategory () {
      if (this.$route.fullPath === '/') {
        return '';
      }
      return this.$route.params.categorySlug;
    },
    categoriesGroup () {
      return store.state.categoriesGroup;
    }
  },
  methods: {
    timeAgo, decodeHTML,
    getMemberAvatarUrl (memberId) {
      let pad = number => ('000000000' + number.toString()).substr(-9);
      let member = this.members[memberId];
      if (member.uid) {
        // Discuz 用户数据
        let matchResult = pad(member.uid).match(/(\d{3})(\d{2})(\d{2})(\d{2})/);
        return `/uploads/avatar/${matchResult[1]}/${matchResult[2]}/${matchResult[3]}/${matchResult[4]}_avatar_big.jpg`;
      } else {
        // 新用户，直接返回字段
        return `/uploads/avatar/${member.avatar || 'default.png'}`;
      }
    },
    loadDiscussionList () {
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
        this.members = res.body.members;
        this.busy = false;
      });
    },
    updateListView () {
      if (!this.selectedCategory) {
        this.$store.commit('setGlobalTitles', []);
        return;
      }
      let categoriesGroup = store.state.categoriesGroup;
      for (let group of categoriesGroup) {
        for (let category of group.categories) {
          if (category.slug === this.selectedCategory) {
            this.$store.commit('setGlobalTitles', [category.name, category.description]);
          }
        }
      }
    },
    loadMore () {
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
        this.members = Object.assign(this.members, res.body.members);
        this.busy = false;
      });
    }
  },
  watch: {
    selectedCategory (val, oldval) {
      if (typeof val === 'undefined' || typeof oldval === 'undefined') {
        return;
      }
      this.loadDiscussionList();
      this.updateListView();
    },
    categoriesGroup () {
      this.updateListView();
    }
  },
  created () {
    this.loadDiscussionList();
  },
  activated () {
    if (this.selectedCategory !== this.slug) {
      this.loadDiscussionList();
    }
    this.updateListView();
  }
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.discussion-list {
  padding-bottom: 20px;
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    div.discussion-list-item {
      padding: 12px;
      margin-bottom: 5px;
    }
  }

  div.discussion-list-item {
    transition: all ease 0.2s;
    border-radius: 4px;
    position: relative;
    display: flex;
    flex-wrap: nowrap;
  }

  $avatar_size: 40px;
  div.avater {
    display: inline-block;
    position: relative;
    margin: 3px;
    width: $avatar_size;
    height: $avatar_size;
    font-size: $avatar_size * 0.55;
    line-height: $avatar_size;
    text-align: center;
    border-radius: $avatar_size / 2;
    background-color: mix($theme_color, white, 80%);
    color: white;
    cursor: pointer;
    overflow: hidden;

    div.avatar-image {
      position: absolute;
      width: 100%;
      height: 100%;
      background-size: cover;
    }
  }

  $popup-height: 26px;
  $arrow-width: 5px;
  $arrow-height: 6px;
  $popup-color: #333;
  div.creater-info-popup {
    display: inline-block;
    position: absolute;
    margin-top: 8px;
    margin-left: 8px;
    background:  $popup-color;
    border-radius: 4px;
    font-size: 13.6px;
    line-height: $popup-height;
    color: white;
    opacity: 0;
    transition: opacity ease 0.2s;
    pointer-events: none;

    div.triangle-left {
      display: inline-block;
      margin-left: -$arrow-width;
      margin-top: ($popup-height - $arrow-height) / 2;
      width: 0;
      height: 0;
      border-top: $arrow-height / 2 solid transparent;
      border-bottom: $arrow-height / 2 solid transparent; 
      border-right: $arrow-width solid $popup-color;
      vertical-align: top;
    }

    span {
      display: inline-block;
      opacity: 1;
      padding-left: 8px;
      padding-right: 8px;
    }
  }

  div.avater:hover + div.creater-info-popup {
    opacity: 1;
  }

  .discussion-avatar {
    order: 1;
    flex-shrink: 0;
  }

  div.discussion-meta {
    padding-left: 12px;
    display: inline-block;
    order: 2;
    flex-shrink: 2;
    flex-grow: 2;
    overflow: auto;
    vertical-align: top;
    height: 45px;
    overflow: hidden;
  }

  div.discussion-meta-right {
    order: 3;
    flex-shrink: 0;
    flex-grow: 0;
    padding-left: 12px;
    height: 45px;
    line-height: 45px;

    span.discussion-category {
      font-size: 12px;
      margin-right: 5px;
      padding: 4px 7px 4px 7px;
      border-radius: 3px;
      cursor: pointer;
      margin-right: 12px;
    }
  }

  h3.discussion-title {
    white-space: nowrap;
    font-weight: normal;
    font-size: 16px;
    margin: 0;
    transition: color ease 0.2s;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  div.discussion-meta-other {
    white-space: nowrap;
    overflow: hidden;

    span.discussion-last-reply {
      line-height: 24px;
      font-size: 12px;
    }

    span.discussion-user, span.discussion-tags {
      font-size: 12px;
      font-weight: bold;
      border-radius: 4px;
      padding: 3px;
      transition: background ease 0.2s;
      cursor: pointer;
    }

    span.discussion-tags {
      margin-left: 0.4em;
    }
  }

  div.discussion-button {
    margin: 10px auto 0 auto;
    font-size: 0.8em;
    width: 60px;
    line-height: 16px;
    border-radius: 4px;
    text-align: center; 
    padding: 6px;
    transition: all ease 0.1s;
    cursor: pointer;
  }

  div.discussion-page-nav {
    padding-top: 4px;
  }

  div.discussion-button:hover {
    background: mix($theme_color, white, 25%);
  }
}

.light-theme div.discussion-list {
  color: black;
  div.discussion-list-item:hover {
    background-color: rgba($theme_color, 0.1);
  }
  span.discussion-category {
    background-color: $theme_color;
    color: white;
  }
  h3.discussion-title:hover {
    color: $theme_color;
  }
  span.discussion-user, span.discussion-tags {
    color: mix($theme_color, white, 90%);
  }
  span.discussion-tags {
    background: mix($theme_color, white, 15%);
  }
  span.discussion-user {
    color: mix($theme_color, black, 75%);
  }
  span.discussion-tags:hover {
    background: mix($theme_color, white, 30%);
  }
  div.discussion-button {
    color: mix($theme_color, black, 90%);
    background: mix($theme_color, white, 15%);
  }
  div.discussion-button:hover {
    color: mix($theme_color, black, 60%);
  }
}

.dark-theme div.discussion-list {
  color: lightgray;
  div.discussion-list-item:hover {
    background-color: #333; 
  }
  span.discussion-category {
    background-color: mix($theme_color, black, 10%); 
    color: grey;
  }
  h3.discussion-title:hover {
    color: #eee;
  }
  span.discussion-tags {
    background: black;
    color: gray;
  }
  span.discussion-user {
    color: gray;
  }
  span.discussion-user:hover {
    color: lightgray;
  }
  span.discussion-tags:hover {
    background: mix(black, white, 80%);
  }
  div.discussion-button {
    color: gray;
    background: #333;
  }
  div.discussion-button:hover {
    color: lightgray;
  }
}

</style>
