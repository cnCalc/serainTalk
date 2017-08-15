<template lang="pug">
  div.discussion-view
    div.discussion-view-left
      loading-icon(v-if="busy")
      ul.discussion-post-list.hide: li(v-for="post in discussionPosts" :id="`index-${post.index}`" v-if="typeof post !== 'undefined'")
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
    div.discussion-view-right
      div.functions-slide-bar-container(v-bind:class="{'fixed-slide-bar': fixedSlideBar}")
        div.quick-funcs 快速操作
        button.button.quick-funcs 订阅更新
        button.button.quick-funcs 回复帖子
        button.button.quick-funcs 只看楼主
</template>

<script>
import LoadingIcon from './LoadingIcon.vue';
import PostContent from './PostContent.vue';
import config from '../config';
import { indexToPage } from '../utils/filters';

export default {
  name: 'discussion-view',
  components: {
    LoadingIcon, PostContent
  },
  data () {
    return {
      pageSize: config.api.pagesize,
      busy: true,
      discussion: null,
      discussionMeta: {},
      discussionPosts: [],
      members: {},
      minPage: null,
      maxPage: null,
      currentPage: null,
      fixedSlideBar: false,
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
    loadDiscussionData () {
      this.discussionId = this.$route.params.discussionId;
      this.currentPage = indexToPage(this.$route.params.index, config.pagesize) || 1;
      this.minPage = this.maxPage = this.currentPage;
      let url = `${config.api.url}${config.api.version}/discussion/${this.discussionId}`;
      this.$http.get(url).then(res => {
        delete res.body.status;

        if (!res.body.title) {
          this.$router.replace('/404');
        }

        this.discussionMeta = res.body;
        this.$store.commit('setGlobalTitles', [this.discussionMeta.title, this.discussionMeta.category]);

        let url = `${config.api.url}${config.api.version}/discussion/${this.discussionId}/posts?page=${this.currentPage}`;
        this.$http.get(url).then(res => {
          res.body.posts.forEach(post => {
            this.discussionPosts[post.index] = post;
          });
          this.members = res.body.members;
          this.busy = false;
          this.$nextTick(() => {
            if (this.$route.params.index) {
              let el = document.querySelector(`#index-${this.$route.params.index}`);
              el.classList.add('highlight');
              setTimeout(() => {
                el.classList.remove('highlight');
              }, 2000);
              el.scrollIntoView();
              if (el.getBoundingClientRect().top === 0) {
                window.scrollTo(0, window.scrollY - 60); // Height of NavBar
              }
            }
            document.querySelector('ul.discussion-post-list.hide').classList.remove('hide');
          });
        });
      }, res => {
        // on error
        if (res.status === 400) {
          this.$router.replace('/400');
        }
      });
    },
    loadNextPage () {
      if (indexToPage(this.discussionMeta.postsCount, config.pagesize) <= this.maxPage || this.busy) {
        return;
      } else {
        this.busy = true;
        this.maxPage++;
        let url = `${config.api.url}${config.api.version}/discussion/${this.discussionId}/posts?page=${this.maxPage}`;
        this.$http.get(url).then(res => {
          res.body.posts.forEach(post => {
            this.discussionPosts[post.index] = post;
          });
          this.members = Object.assign(this.members, res.body.members);
          this.$nextTick(() => { this.busy = false; });
        });
      }
    },
    loadPrevPage () {
      if (this.minPage <= 1 || this.busy) {
        return;
      } else {
        this.busy = true;
        this.minPage--;
        let url = `${config.api.url}${config.api.version}/discussion/${this.discussionId}/posts?page=${this.minPage}`;
        this.$http.get(url).then(res => {
          res.body.posts.forEach(post => {
            this.discussionPosts[post.index] = post;
          });
          this.members = Object.assign(this.members, res.body.members);
          let diff = document.body.clientHeight - window.scrollY;
          this.$nextTick(() => {
            console.log([diff, document.body.clientHeight - diff]);
            window.scrollTo(0, document.body.clientHeight - diff);
            this.$nextTick(() => {
              if (window.scrollY < config.discussionView.boundingThreshold.top / 2) {
                window.scrollTo(0, config.discussionView.boundingThreshold.top / 2);
              }
              this.busy = false;
            });
          });
        });
      }
    },
    scrollWatcher () {
      if (window.scrollY + window.innerHeight + config.discussionView.boundingThreshold.bottom > document.body.clientHeight) {
        this.loadNextPage();
      }
      if (window.scrollY < config.discussionView.boundingThreshold.top) {
        this.loadPrevPage();
      }
      // change scroll fix mode.
      this.fixedSlideBar = window.scrollY > 50 + 120;
    },
  },
  created () {
    this.loadDiscussionData();
    window.addEventListener('scroll', this.scrollWatcher);
  },
  beforeDestory () {
    window.removeEventListener('scroll', this.scrollWatcher);
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
