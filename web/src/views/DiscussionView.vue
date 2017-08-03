<template lang="pug">
  div.discussion-view
    div.discussion-view-left
      loading-icon(v-if="busy")
      ul.discussion-post-list(v-bind:class="{'hide': busy}"): li(v-for="post in discussionPosts" :id="`index-${post.index}`" v-if="post")
        div.discussion-post-container
          router-link(:to="'/m/' + post.user").discussion-post-avater: div.discussion-post-avater
            div.avatar-image(v-bind:style="{ backgroundImage: 'url(' + getMemberAvatarUrl(post.user) + ')'}")
            div.avatar-fallback {{ (members[post.user].username || '?').substr(0, 1).toUpperCase() }}
          article.discussion-post-body
            header.discussion-post-info
              span.discussion-post-member {{ members[post.user].username }}
              span.discussion-post-date {{ `#${post.index}` }}
            post-content.discussion-post-content(:content="post.content")
            footer.discussion-post-info
              div.discussion-post-date 最后编辑于 {{ new Date(1000 * post.createDate).toLocaleDateString() }}
              div.button-left-container
                button.button.vote-up 0
                button.button.vote-down 0
                button.button.laugh 0
                button.button.doubt 0
                button.button.cheer 0
                button.button.emmmm 0
              div.button-right-container
                button.button 回复
                button.button 复制链接
                button.button 编辑
      pagination(:length="9" :active="currentPage" :max="pagesCount" :handler="loadPage")
    div.discussion-view-right
      div.functions-slide-bar-container(v-bind:class="{'fixed-slide-bar': fixedSlideBar}")
        div.quick-funcs 快速操作
        button.button.quick-funcs 订阅更新
        button.button.quick-funcs 回复帖子
        button.button.quick-funcs 只看楼主
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
      minPage: null,
      maxPage: null,
      currentPage: null,
      fixedSlideBar: false,
      pagesCount: 0,
    };
  },
  methods: {
    indexToPage,
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
          this.$nextTick(() => {
            console.log(diff);
            window.scrollTo(0, document.body.clientHeight - diff);
            // this.$nextTick(() => {
            //   if (window.scrollY < config.discussionView.boundingThreshold.top / 2) {
            //     window.scrollTo(0, config.discussionView.boundingThreshold.top / 2);
            //   }
            // });
          })
        });
      }
    },
    loadPage (page) {
      scrollToTop(1000);
      this.$store.dispatch('fetchDiscussionPosts', { id: this.$route.params.discussionId, overwrite: true, page }).then(() => {
        this.currentPage = page;
      });
    },
    scrollWatcher () {
      // if (window.scrollY + window.innerHeight + config.discussionView.boundingThreshold.bottom > document.body.clientHeight) {
      //   this.loadNextPage();
      // }
      // if (window.scrollY < config.discussionView.boundingThreshold.top) {
      //   this.loadPrevPage();
      // }
      // change scroll fix mode.
      this.fixedSlideBar = window.scrollY > 120 + 15;
    },
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
      // this.asyncData({store: this.$store, route: this.$route});
      this.$store.commit('setGlobalTitles', [this.discussionMeta.title, this.discussionMeta.category]);
    }
  },
  mounted () {
    window.addEventListener('scroll', this.scrollWatcher);
    this.maxPage = indexToPage(this.$route.params.index) || 1;
    this.minPage = indexToPage(this.$route.params.index) || 1;
    this.currentPage = indexToPage(this.$route.params.index) || 1;
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.scrollWatcher);
  },
  asyncData ({store, route}) {
    return store.dispatch('fetchDiscussion', { id: route.params.discussionId, page: indexToPage(route.params.index) || 1 }).then(() => {
      if (route.params.index) {
        let el = document.querySelector(`#index-${route.params.index}`);
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
      transition: all ease 0.5s;
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
  blockquote {
    background-color: mix($theme_color, white, 10%);
  }
  div.discussion-post-container {
    border-bottom: mix($theme_color, white, 10%) solid 1px;
  }
  td {
    border: 1px solid mix($theme_color, white, 30%);
  }
  a {
    color: $theme_color;
  }
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
}

.dark-theme div.discussion-view {
  color: lightgray;
  blockquote {
    background-color: #111;
  }
  div.discussion-post-container {
    border-bottom:  solid 1px #444;
  }
  td {
    border: 1px solid #444;
  }
  a {
    color: white;
  }
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
}
</style>
