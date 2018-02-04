<template lang="pug">
  div.discussion-view
    div.discussion-view-left
      loading-icon(v-if="busy && (!$store.state.autoLoadOnScroll || maxPage === minPage)")
      ul.discussion-post-list(v-bind:class="{'hide': busy && (!$store.state.autoLoadOnScroll || maxPage === minPage)}"): li(v-for="post in showingPosts" :id="`index-${post.index}`" v-if="post" v-bind:class="{ deleted: post.status.type === 'deleted' }")
        div.discussion-post-container
          article.discussion-post-body
            header.discussion-post-info
              router-link(:to="'/m/' + post.user").discussion-post-avater: div.discussion-post-avater
                div.avatar-image(v-if="members[post.user].avatar !== null" v-bind:style="{ backgroundImage: 'url(' + members[post.user].avatar + ')'}")
                div.avatar-fallback(v-else) {{ (members[post.user].username || '?').substr(0, 1).toUpperCase() }}
              span.discussion-post-member {{ members[post.user].username }} 
              span.discussion-post-index {{ `#${post.index}` + (post.status.type === 'deleted' ? '（仅管理员可见）' : '') }}
            post-content.discussion-post-content(:content="post.content", :reply-to="post.replyTo", :encoding="post.encoding")
            footer.discussion-post-info
              div.discussion-post-date
                span 创建于 {{ new Date(post.createDate).toLocaleDateString() }}
                span(v-if="post.updateDate") ，编辑于 {{ new Date(post.updateDate).toLocaleDateString() }}
              div.button-left-container
                button.button.vote-up(@click="votePost(post.index, 'up')" :title="(post.votes.up || []).map(id => (members[id] || { username: 'undefined' }).username).join(', ')") {{ post.votes.up ? post.votes.up.length : 0 }}
                button.button.vote-down(@click="votePost(post.index, 'down')" :title="(post.votes.down || []).map(id => (members[id] || { username: 'undefined' }).username).join(', ')") {{ post.votes.down ? post.votes.down.length : 0 }}
                div.show-only-when-hover(style="float: right; display: flex; flex-direction: row-reverse; align-items: center")
                  button.button(@click="activateEditor('REPLY_TO_INDEX', discussionMeta._id, post.user, post.index)") 回复
                  button.button(@click="copyLink(post.index)") 复制链接
                  template(v-if="$store.state.me")
                    button.button(v-if="(post.user === $store.state.me._id || $store.state.me.role === 'admin')" @click="activateEditor('EDIT_POST', discussionMeta._id, post.user, post.index)") 编辑
                    template(v-if="$store.state.me.role === 'admin'")
                      button.button(v-if="post.status.type === 'deleted'" @click="deletePost(post.index)") 恢复
                      button.button(v-else @click="deletePost(post.index)") 删除
                //- button.button.laugh(v-if="post.votes.up.length > 0") {{ post.votes.up.length }}
                //- button.button.doubt(v-if="post.votes.up.length > 0") {{ post.votes.up.length }}
                //- button.button.cheer(v-if="post.votes.up.length > 0") {{ post.votes.up.length }} 
                //- button.button.emmmm(v-if="post.votes.up.length > 0") {{ post.votes.up.length }}
              //- div.button-right-container
      div(v-if="!busy && showingPosts.length === 0" style="height: 200px; line-height: 200px; font-size: 1.2em; color: grey")
        center 没有可展示的帖子
      pagination(v-bind:class="{'hide': busy}" :length="9" :active="currentPage" :max="pagesCount" :handler="loadPage" v-if="!$store.state.autoLoadOnScroll")
    div.discussion-view-right
      div.functions-slide-bar-container(v-bind:class="{'fixed-slide-bar': fixedSlideBar}", v-bind:style="{ opacity: busy ? 0 : 1 }")
        div.quick-funcs 快速操作
        button.button.quick-funcs 订阅更新
        button.button.quick-funcs(@click="activateEditor('REPLY', discussionMeta._id)") 回复帖子
        //- button.button.quick-funcs(@click="createrOnly = !createrOnly") {{ createrOnly ? '查看全部' : '只看楼主' }} 
        button.button.quick-funcs(@click="scrollToTop(400)") 回到顶部
        template(v-if="$store.state.me && $store.state.me.role === 'admin'")
          button.button.quick-funcs 前往后台
</template>

<script>
import LoadingIcon from '../components/LoadingIcon.vue';
import PostContent from '../components/PostContent.vue';
import Pagination from '../components/Pagination.vue';
import copyToClipboard from '../utils/clipboard';
import api from '../api';
import titleMixin from '../mixins/title';

import config from '../config';
import { indexToPage } from '../utils/filters';
import scrollToTop from '../utils/scrollToTop';

function scrollToHash (hash) {
  let el = document.querySelector(hash);
  if (!el) {
    console.log('element not found: ' + hash);
    // throw new Error('fuck')
    return;
  }
  el.classList.add('highlight');
  setTimeout(() => {
    el.classList.remove('highlight');
  }, 2000);
  el.scrollIntoView();
  setTimeout(() => {
    if (el.getBoundingClientRect().top < 60) {
      window.scrollTo(0, window.scrollY - 60); // Height of NavBar
    }
  }, 0);
}

export default {
  name: 'discussion-view',
  components: {
    LoadingIcon, PostContent, Pagination,
  },
  mixins: [titleMixin],
  data () {
    return {
      pagesize: config.api.pagesize,
      minPage: null,  // 当前已加载的最小页数，仅在滚动自加载模式中有效
      maxPage: null,  // 当前已加载的最大页数，仅在滚动自加载模式中有效
      currentPage: null,
      fixedSlideBar: false,
      pagesCount: 0,  // 总页数
      pageLoaded: {}, // 已经加载了的页面
      currentDiscussion: null,
      createrOnly: false,
    };
  },
  title () {
    if (this.busy) {
      return 'Loading';
    }
    return `${this.discussionMeta.title}`;
  },
  methods: {
    indexToPage, scrollToTop, copyToClipboard,
    preventScroll () {
      return false;
    },
    loadNextPage () {
      if (this.maxPage < indexToPage(this.discussionMeta.postsCount) && !this.busy) {
        this.maxPage++;
        this.$store.dispatch('fetchDiscussionPosts', { id: this.$route.params.discussionId, page: this.maxPage });
      }
    },
    deletePost (index) {
      api.v1.discussion.deletePostByDiscussionIdAndIndex({ id: this.$route.params.discussionId, index })
        .then(() => {
          this.$store.dispatch('updateSingleDiscussionPost', { id: this.currentDiscussion, index, raw: false });
        })
        .catch(err => {
          window.alert('Error, see console for more detail.');
          console.error(err);
        });
    },
    votePost (index, type) {
      api.v1.discussion.votePostByDiscussionIdAndIndex({ id: this.currentDiscussion, index, vote: type })
        .then(res => {
          this.$store.dispatch('updateSingleDiscussionPost', { id: this.currentDiscussion, index, raw: false });
        })
        .catch(err => {
          console.error(err);
        });
    },
    loadPrevPage () {
      const state = this.$store;

      if (this.minPage > 1 && !this.busy) {
        this.minPage--;
        state.commit('setBusy', true);

        api.v1.discussion.fetchDiscussionPostsById({
          id: this.$route.params.discussionId,
          page: this.minPage,
        }).then(data => {
          state.commit('mergeMembers', data.members);
          state.commit('updateDiscussionPosts', data.posts);
          let diff = document.body.clientHeight - window.scrollY;
          this.$nextTick(() => {
            window.scrollTo(0, document.body.clientHeight - diff);
            state.commit('setBusy', false);
          });
        });
      }
    },
    loadPage (page) {
      scrollToTop(1000);
      this.$router.push(`/d/${this.$route.params.discussionId}/${page}`);
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
    activateEditor (mode, discussionId, memberId, index) {
      this.$store.commit('updateEditorMode', { mode, discussionId, discussionTitle: this.discussionMeta.title, memberId, index });
      this.$store.commit('updateEditorDisplay', 'show');
    },
    copyLink (idx) {
      copyToClipboard(`${window.location.origin}/d/${this.discussionMeta._id}#index-${idx}`);
    },
  },
  computed: {
    discussionMeta () {
      return this.$store.state.discussionMeta;
    },
    discussionPosts () {
      if (!this.$store.state.autoLoadOnScroll) {
        return this.$store.state.discussionPosts.slice((this.currentPage - 1) * this.pagesize + 1, this.currentPage * this.pagesize + 1);
      } else {
        return this.$store.state.discussionPosts;
      }
    },
    showingPosts () {
      if (this.createrOnly) {
        return this.discussionPosts.filter(item => item.user === this.discussionMeta.creater);
      } else {
        return this.discussionPosts;
      }
    },
    members () {
      return this.$store.state.members;
    },
    busy () {
      return this.$store.state.busy;
    },
  },
  watch: {
    discussionMeta (val) {
      this.$store.commit('setGlobalTitles', [this.discussionMeta.title, this.discussionMeta.category]);
      this.pagesCount = indexToPage(this.discussionMeta.postsCount);
    },
    '$route': function (route) {
      if (!route.params.discussionId) {
        return;
      }

      if (this.currentDiscussion !== route.params.discussionId) {
        const page = Number(this.$route.params.page) || 1;

        this.$store.commit('setGlobalTitles', [' ']);
        this.currentDiscussion = route.params.discussionId;
        this.maxPage = page;
        this.minPage = page;
        this.currentPage = page;
        this.createrOnly = false;
        this.pageLoaded = [];
        this.pageLoaded[this.currentPage] = true;

        return this.$options.asyncData.call(this, { store: this.$store, route: this.$route }).then(() => {
          this.$forceUpdate();
          this.scrollWatcher();
          if (this.$store.state.autoLoadOnScroll && page !== 1) {
            this.minPage = page - 1;
            this.pageLoaded[this.currentPage - 1] = true;
          }
        });
      }

      this.scrollWatcher();
      this.$store.commit('setGlobalTitles', [this.discussionMeta.title, this.discussionMeta.category]);

      if (this.pageLoaded[Number(route.params.page) || 1]) {
        this.currentPage = Number(route.params.page) || 1;
        this.$nextTick(() => this.$route.hash && scrollToHash(this.$route.hash));
        return;
      }

      this.$store.dispatch('fetchDiscussionPosts', { id: this.$route.params.discussionId, page: route.params.page }).then(() => {
        this.currentPage = Number(route.params.page) || 1;
        this.pageLoaded[this.currentPage] = true;
        this.$nextTick(() => this.$route.hash && scrollToHash(this.$route.hash));
      });
    },
    '$route.hash': function (hash) {
      hash && scrollToHash(hash);
    },
  },
  created () {
    this.currentDiscussion = this.$route.params.discussionId;
  },
  mounted () {
    window.addEventListener('scroll', this.scrollWatcher, { passive: true });

    const page = Number(this.$route.params.page) || 1;
    this.maxPage = page;
    this.minPage = page;
    this.currentPage = page;
    this.createrOnly = false;
    this.pageLoaded[this.currentPage] = true;

    if (this.$store.state.autoLoadOnScroll && page !== 1) {
      this.minPage = page - 1;
      this.pageLoaded[this.currentPage - 1] = true;
    }
  },
  beforeDestroy () {
    window.removeEventListener('scroll', this.scrollWatcher);
  },
  activated () {
    this.updateTitle();
    window.addEventListener('scroll', this.scrollWatcher, { passive: true });
  },
  deactivated () {
    window.removeEventListener('scroll', this.scrollWatcher);
  },
  asyncData ({ store, route }) {
    const page = Number(route.params.page) || 1;
    return store.dispatch('fetchDiscussion', { id: route.params.discussionId, page, preloadPrevPage: store.state.autoLoadOnScroll }).then(() => {
      if (window.location.hash) {
        scrollToHash(window.location.hash);
      }
      this.updateTitle();
    });
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.discussion-view {
  padding: 16px 8px;
  text-align: left;
  display: flex;

  .hide {
    transition: all ease 0s;
  }

  div.discussion-view-left {
    // overflow: hidden;
    flex: 1 1;
    min-width: 0;
    // width: 100%;
    padding-right: 5px;
  }

  $right_width: 100px;
  div.discussion-view-right {
    order: 2;
    flex: 0 0 $right_width;
    position: relative;
    @include respond-to(phone){
      display: none;
    }

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
      transition: background ease 0.5s;
      &.deleted {
        background-color: #ffe8e8e8;
      }
      div.discussion-post-container {
        display: flex;
        padding: 16px 8px;

      }

      @mixin set-avatar-size($avatar-size) {
        a.discussion-post-avater {
          width: $avatar-size;
          height: $avatar-size;
        }
        div.discussion-post-avater {
          width: $avatar-size;
          height: $avatar-size;
          border-radius: $avatar-size / 2;
          line-height: $avatar-size;
          font-size: $avatar-size * 0.45;
        }
      }

      @mixin set-avatar-outside($avatar-size) {
        a.discussion-post-avater {
          display: block;
          width: 0;
          height: 0;
          overflow: show;
        }
        div.discussion-post-avater {
          margin-left: -$avatar-size - 12px - 4px;
          margin-top: -10px;
          z-index: 1;
        }
        .discussion-post-body > * {
          padding-left: $avatar-size + 12px + 8px;
        }
      }

      @include respond-to(phone) {
        @include set-avatar-size(32px);
        span.discussion-post-member {
          padding: 0 0.3em;
        }
      }

      @include respond-to(tablet) {
        @include set-avatar-size(50px);
        @include set-avatar-outside(50px);
      }

      @include respond-to(laptop) {
        @include set-avatar-size(60px);
        @include set-avatar-outside(60px);
      }

      // div.show-only-when-hover {
      //   transition: all ease 0.2s;
      //   opacity: 0;
      // }

      // &:hover div.show-only-when-hover {
      //   opacity: 1;
      // }

      header.discussion-post-info {
        display: flex;
        align-items: center;
      }

      span.discussion-post-member {
        flex-grow: 1;
        flex-shrink: 1;
        font-size: 0.9em;
        font-weight: bold;
      }

      span.discussion-post-index {
        margin-right: 0.5em;
        font-size: 0.9em;
      }

      div.discussion-post-avater {
        position: relative;
        order: 1;
        flex-grow: 0;
        flex-shrink: 0;
        background-color: mix($theme_color, white, 80%);
        text-align: center;
        color: white;
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
        max-width: 100%;
        // padding: 5px;

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

          // div.button-left-container {
          //   display: inline-block;
          // }

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
    &:first-child {
      margin-left: 0;
    }
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
