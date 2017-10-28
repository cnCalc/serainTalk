<template lang="pug">
  div.discussion-view
    div.discussion-view-left
      loading-icon(v-if="busy && !$store.state.autoLoadOnScroll")
      ul.discussion-post-list(v-bind:class="{'hide': busy && !$store.state.autoLoadOnScroll}"): li(v-for="post in discussionPosts" :id="`index-${post.index}`" v-if="post")
        div.discussion-post-container
          router-link(:to="'/m/' + post.user").discussion-post-avater: div.discussion-post-avater
            div.avatar-image(v-if="members[post.user].avatar !== null" v-bind:style="{ backgroundImage: 'url(' + members[post.user].avatar + ')'}")
            div.avatar-fallback(v-else) {{ (members[post.user].username || '?').substr(0, 1).toUpperCase() }}
          article.discussion-post-body
            header.discussion-post-info
              span.discussion-post-member {{ members[post.user].username }}
              span.discussion-post-index {{ `#${post.index}` }}
            post-content.discussion-post-content(:content="post.content")
            footer.discussion-post-info
              div.discussion-post-date 最后编辑于 {{ new Date(1000 * post.createDate).toLocaleDateString() }}
              div.button-left-container
              //-   button.button.vote-up 0
              //-   button.button.vote-down 0
              //-   button.button.laugh 0
              //-   button.button.doubt 0
              //-   button.button.cheer 0
              //-   button.button.emmmm 0
              //- div.button-right-container
              button.button(@click="activateEditor('REPLY_TO_INDEX', discussionMeta._id, post.index)") 回复
              button.button 复制链接
              button.button 编辑
      pagination(v-bind:class="{'hide': busy}" :length="9" :active="currentPage" :max="pagesCount" :handler="loadPage" v-if="!$store.state.autoLoadOnScroll")
    div.discussion-view-right
      div.functions-slide-bar-container(v-bind:class="{'fixed-slide-bar': fixedSlideBar}")
        div.quick-funcs 快速操作
        button.button.quick-funcs 订阅更新
        button.button.quick-funcs 回复帖子
        button.button.quick-funcs 只看楼主
        button.button.quick-funcs(@click="scrollToTop(400)") 回到顶部
</template>

<script>
import LoadingIcon from '../components/LoadingIcon.vue';
import PostContent from '../components/PostContent.vue';
import Pagination from '../components/Pagination.vue';

import config from '../config';
import { indexToPage } from '../utils/filters';
import scrollToTop from '../utils/scrollToTop';

export default {
  name: 'discussion-view',
  components: {
    LoadingIcon, PostContent, Pagination
  },
  data () {
    return {
      pageSize: config.api.pagesize,
      minPage: null,  // 当前已加载的最小页数，仅在滚动自加载模式中有效
      maxPage: null,  // 当前已加载的最大页数，仅在滚动自加载模式中有效
      currentPage: null,
      fixedSlideBar: false,
      pagesCount: 0,  // 总页数
    };
  },
  methods: {
    indexToPage, scrollToTop,
    loadNextPage () {
      if (this.maxPage < indexToPage(this.discussionMeta.postsCount) && !this.busy) {
        this.maxPage++;
        this.$store.dispatch('fetchDiscussionPosts', { id: this.$route.params.discussionId, page: this.maxPage });
      }
    },
    loadPrevPage () {
      if (this.minPage > 1 && !this.busy) {
        this.minPage--;
        let diff = document.body.clientHeight - window.scrollY;
        this.$store.dispatch('fetchDiscussionPosts', { id: this.$route.params.discussionId, page: this.minPage })
        .then(() => {
          window.scrollTo(0, document.body.clientHeight - diff);
          // this.$nextTick(() => {
          //   window.scrollTo(0, document.body.clientHeight - diff);
          //   // this.$nextTick(() => {
          //   //   if (window.scrollY < config.discussionView.boundingThreshold.top / 2) {
          //   //     window.scrollTo(0, config.discussionView.boundingThreshold.top / 2);
          //   //   }
          //   // });
          // })
        });
      }
    },
    loadPage (page) {
      scrollToTop(1000);
      this.$router.push({ path: `/d/${this.$route.params.discussionId}/${page}` });
      // this.$store.dispatch('fetchDiscussionPosts', { id: this.$route.params.discussionId, overwrite: true, page }).then(() => {
      //   this.currentPage = page;
      // });
    },
    scrollWatcher () {
      if (this.$store.state.autoLoadOnScroll) {
        if (window.scrollY + window.innerHeight + config.discussionView.boundingThreshold.bottom > document.body.clientHeight) {
          this.loadNextPage();
        }
        if (window.scrollY < config.discussionView.boundingThreshold.top) {
          this.loadPrevPage();
        }
      }
      // 变更右侧边栏的固定模式
      this.fixedSlideBar = window.scrollY > 120 + 15;
    },
    activateEditor (mode, id, idx) {
      this.$store.commit('updateEditorMode', mode, id, idx);
      this.$store.commit('updateEditorDisplay', 'show');
    }
  },
  computed: {
    discussionMeta () {
      return this.$store.state.discussionMeta;
    },
    discussionPosts () {
      return this.$store.state.discussionPosts;
    },
    members () {
      return this.$store.state.members;
    },
    busy () {
      return this.$store.state.busy;
    }
  },
  watch: {
    discussionMeta (val) {
      this.$store.commit('setGlobalTitles', [this.discussionMeta.title, this.discussionMeta.category]);
      this.pagesCount = indexToPage(this.discussionMeta.postsCount);
    },
    '$route': function (route) {
      this.$store.commit('setGlobalTitles', [this.discussionMeta.title, this.discussionMeta.category]);
      // this.$options.asyncData({ store: this.$store, route });
      this.$store.dispatch('fetchDiscussionPosts', { id: this.$route.params.discussionId, overwrite: true, page: route.params.page }).then(() => {
        this.currentPage = route.params.page || 1;
      });
    }
  },
  mounted () {
    window.addEventListener('scroll', this.scrollWatcher);
    this.maxPage = indexToPage(this.$route.params.index) || 1;
    this.minPage = indexToPage(this.$route.params.index) || 1;
    this.currentPage = this.$route.params.page || 1;
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.scrollWatcher);
  },
  asyncData ({ store, route }) {
    return store.dispatch('fetchDiscussion', { id: route.params.discussionId, page: route.params.page || 1 }).then(() => {
      if (window.location.hash) {
        let el = document.querySelector(window.location.hash);
        el.classList.add('highlight');
        setTimeout(() => {
          el.classList.remove('highlight');
        }, 2000);
        el.scrollIntoView();
        if (el.getBoundingClientRect().top === 0) {
          window.scrollTo(0, window.scrollY - 60); // Height of NavBar
        }
      }
    });
  }
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.discussion-view {
  padding: 15px;
  text-align: left;
  display: flex;

  div.discussion-view-left {
    flex-grow: 1;
    flex-shrink: 1;
    order: 1;
  }

  $right_width: 100px;
  div.discussion-view-right {
    flex-grow: 0;
    flex-shrink: 0;
    order: 2;
    width: $right_width;
    position: relative;

    div.functions-slide-bar-container {
      width: $right_width;
      font-size: 0.8em;

      button.quick-funcs {
        width: 100%;
      }

      div.quick-funcs {
        margin: 1em 0 1em 0;
        width: 100%;
        padding: 0;
        text-align: center;
      }
    }

    div.fixed-slide-bar {
      position: fixed;
      top: 50px;
    }
  }

  ul.discussion-post-list {
    list-style: none;
    margin: 0;
    padding: 0;
    transition: all ease 0.5s;

    li {
      div.discussion-post-container {
        display: flex;
        padding: 15px 0 15px 15px;
      }

      $avatar-size: 50px;
      a.discussion-post-avater {
        width: $avatar-size;
        height: $avatar-size;
      }

      div.discussion-post-avater {
        position: relative;
        order: 1;
        flex-grow: 0;
        flex-shrink: 0;
        width: $avatar-size;
        height: $avatar-size;
        border-radius: $avatar-size / 2;
        background-color: mix($theme_color, white, 80%);
        text-align: center;
        color: white;
        line-height: $avatar-size;
        font-size: $avatar-size * 0.45;
        overflow: hidden;

        div.avatar-image {
          position: absolute;
          width: 100%;
          height: 100%;
          background-size: cover;
        }
      }

      article.discussion-post-body {
        order: 2;
        flex-grow: 1;
        flex-shrink: 1;
        margin-left: 15px;
        padding: 5px;

        span.discussion-post-member {
          font-size: 0.9em;
          font-weight: bold;
        }

        span.discussion-post-index {
          float: right;
          margin-right: 0.5em;
          font-size: 0.9em;
        }

        span.discussion-post-date {
          margin-left: 0.5em;
          font-size: 0.9em;
        }

        div.discussion-post-content {
          padding-top: 10px;
          line-height: 26px;
          font-size: 14px;
          word-wrap: break-word;
          box-sizing: border-box;
        }

        footer.discussion-post-info {
          font-size: 0.8em;
          position: relative;

          div.discussion-post-date {
            color: grey;
            line-height: 3em;
          }

          div.button-left-container {
            display: inline-block;
          }

          div.button-right-container {
            display: inline-block;
            position: absolute;
            right: 0;
          }
        }
      }
    }
  }
  button.button {
    margin: 2px;
    padding: 0.5em 0.8em 0.5em 0.8em;
    line-height: 1.2em;
    border: none;
  }

  button.right {
    float: right;
  }

  button.vote-up::before { content: '👍 '; }
  button.vote-down::before { content: '👎 '; }
  button.laugh::before { content: '😄 '; }
  button.doubt::before { content: '😕 '; }
  button.love::before { content: '❤️ '; }
  button.cheer::before { content: '🎉 '; }
  button.emmmm::before { content: '🌚 '; }
}

.light-theme div.discussion-view {
  li.highlight {
    background-color: rgba(255, 255, 0, 0.15);
  }
  button.button {
    background-color: mix($theme_color, white, 10%);
    color: $theme_color;
  }
  button.button:hover {
    background-color: mix($theme_color, white, 20%);
  }
  div.discussion-post-container {
    border-bottom: mix($theme_color, white, 10%) solid 1px;
  }
}

.dark-theme div.discussion-view {
  color: lightgrey;
  li.highlight {
    background-color: rgba(255, 255, 0, 0.1);
  }
  button.button {
    background-color: #444;
    color: white;
  }
  button.button:hover {
    background-color: #555;
  }
  div.discussion-post-container {
    border-bottom:  solid 1px #444;
  }
}
</style>
