<template lang="pug">
  div.st-header
    div.container
      div.drawer-trigger(@click="categoryDrawerTrigger"): svg.drawer-trigger(viewBox="0 0 33.866666 33.866668"): g(transform="translate(0,-263.13332)")
        rect(width="28.965336" height="5.5324793" x="2.4506655" y="277.30042")
        rect(width="28.965336" height="5.5324793" x="2.4506655" y="267.77527")
        rect(width="28.965336" height="5.5324793" x="2.4506655" y="286.82556")
      router-link.title(to="/" title="cnCalc"): h1 cnCalc.org
      template(v-for="link in links")
        a.extra-link(v-if="link.external" :href="link.href" target="_blank" :title="link.text") {{ link.text }}
        router-link.extra-link(v-else :to="link.href" :title="link.text") {{ link.text }}
      div.spring
      div.search-wrapper
        input.search(type="text", placeholder="搜索", v-model="search", @focus="setHintVisiable(true)", @blur="setHintVisiable(false)")
        div.input-hint-container(v-bind:class="{ visiable: searchHintsVisiable }"): div.input-hint
          div.search-info(v-if="search === ''")
            span 输入关键字搜索标题和用户，按下回车搜索内容
            div.loading-icon(v-show="loadingSearchResult")
          template(v-else)
            div.section 
              span 帖子
              div.loading-icon(v-show="loadingSearchResult")
            ul(v-if="search !== '' && searchHints.discussions.length !== 0")
              router-link(v-for="hint in searchHints.discussions" :to="`/d/${hint._id}`" :key="hint._id")
                li
                  span(style="font-family: monospace; color: gray") ({{ hint.postsCount }})
                  | &nbsp;{{ hint.title }}
            div.search-not-found(v-else) 没有找到相关标题，尝试回车搜索全文？
            div.section
              span 用户
              div.loading-icon(v-show="loadingSearchResult")
            ul(v-if="search !== '' && searchHints.members.length !== 0")
              router-link(v-for="hint in searchHints.members" :to="`/m/${hint._id}`" :key="hint._id")
                li {{ hint.username }}
            div.search-not-found(v-else) 没有找到相关用户。
      template(v-if="!me || typeof me._id === 'undefined'")
        router-link.right(:to="`/signup?next=${encodeURIComponent(path)}`" title="注册") 注册
        router-link.right(:to="`/signin?next=${encodeURIComponent(path)}`" title="登录") 登录
      template(v-else)
        notification-control
        member-control
      div.mobile-drawer-overlay(v-bind:class="{ active: isCategoryDrawerActivated }")
      div.mobile-drawer(v-bind:class="{ active: isCategoryDrawerActivated }")
        div.category-list: category-list
</template>

<script>
import CategoryList from '../components/CategoryList.vue';
import NotificationControl from './NotificationControl.vue';
import MemberControl from './MemberControl.vue';
import LoadingIcon from './LoadingIcon.vue';
import api from '../api';

export default {
  name: 'nav-bar',
  components: {
    CategoryList, NotificationControl, MemberControl, LoadingIcon,
  },
  data () {
    return {
      links: [
        // { href: '/', external: false, text: '首页' },
        { href: 'https://github.com/cnCalc', external: true, text: 'GitHub' },
        { href: 'http://tieba.baidu.com/f?kw=fx%2Des%28ms%29', external: true, text: 'fx-es(ms) 吧' },
      ],
      isCategoryDrawerActivated: false,
      search: '',
      searchHints: {
        discussions: [],
        members: [],
      },
      updateSearchHintsTimeoutId: null,
      searchHintsVisiable: false,
      loadingSearchResult: false,
    };
  },
  computed: {
    path () {
      return this.$route.fullPath;
    },
    me () {
      return this.$store.state.me;
    },
  },
  methods: {
    categoryDrawerTrigger () {
      if (!this.isCategoryDrawerActivated) {
        this.categoryDrawerActivate();
      }
    },
    categoryDrawerActivate () {
      this.isCategoryDrawerActivated = true;
      this.$nextTick(() => {
        document.addEventListener('click', this.categoryDrawerDeactivate);
      });
    },
    categoryDrawerDeactivate () {
      this.isCategoryDrawerActivated = false;
      document.removeEventListener('click', this.categoryDrawerDeactivate);
    },
    setHintVisiable (visiable) {
      if (visiable) {
        this.searchHintsVisiable = true;
      } else {
        setTimeout(() => {
          this.searchHintsVisiable = false;
        }, 200);
      }
    },
    updateSearchHints () {
      if (this.search === '') {
        this.searchHints = [];
        return;
      }

      this.searchHintsVisiable = true;
      this.loadingSearchResult = true;
      if (this.updateSearchHintsTimeoutId) {
        clearTimeout(this.updateSearchHintsTimeoutId);
      }

      this.updateSearchHintsTimeoutId = setTimeout(() => {
        this.loadingSearchResult = true;
        if (this.search === '') {
          this.loadingSearchResult = false;
          return;
        }
        Promise.all([
          api.v1.search.searchDiscussionTitle({ keywords: this.search }),
          api.v1.search.searchMember({ keywords: this.search }),
        ]).then(([discussionRes, memberRes]) => {
          this.searchHints = {
            discussions: discussionRes.result,
            members: memberRes.result,
          };
          this.loadingSearchResult = false;
        });
      }, 300);
    },
  },
  watch: {
    search () {
      this.updateSearchHints();
    },
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.st-header {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  width: 100vw;
  text-align: center;
  z-index: 100;

  div.container {
    text-align: left;
    height: 50px;
    vertical-align: top;
    padding: 0 5px;
    white-space: nowrap;
    position: relative;
    display: flex;
    align-items: center;

    > * {
      margin: 0 5px;
    }

    a.title {
    }

    .right {
      font-size: 14px;
    }

    a.extra-link {
      font-size: 14px;
      @include respond-to(phone) {
        display: none;
      }
    }

    h1 {
      font-size: 1.5em;
      color: white;
      padding: 0; 
      margin: 0;
      font-weight: normal;
      line-height: 50px;
    }

    div.search-wrapper {
      width: fit-content;
      position: relative;
    }

    input.search {
      border: none;
      padding: 5px;
      border-radius: 5px;
      color: white;
      transition: all ease 0.4s;
      min-width: 0;
      width: 320px;
      @include respond-to(phone) {
        flex-grow: 1;
        flex-shrink: 1;
        width: 100%;
      }

      &:focus {
        outline: none;
        // width: 320px;
        @include respond-to(phone) {
          width: 100%;
        }
      }
    }

    div.input-hint-container {
      position: absolute;
      left: 0;
      right: 0;
      height: 0;
      opacity: 0;
      pointer-events: none;
      transition: all ease 0.2s;
      &.visiable {
        display: block;
        opacity: 1;
        pointer-events: initial;
      }
    }

    div.input-hint {
      font-size: 12px;
      background: white;
      padding: 0.5em;
      color: $theme_color;
      border: 1px solid $theme_color;
      overflow: hidden;
      text-overflow: ellipsis;
      border-bottom-left-radius: 4px;
      border-bottom-right-radius: 4px;
      text-align: left;
      box-shadow: 0 2px 4px rgba(black, 0.3);
      padding-left: 0;
      padding-right: 0;
      > * {
        padding: 0 0.7em;
      }
    }

    div.input-hint {
      div.search-info {
        padding: 0.3em 0.7em;
      }

      @keyframes spin {
        100% {
          transform:rotate(360deg);
        }
      }

      div.loading-icon {
        background-image: url(../assets/loading.svg);
        background-size: cover;
        vertical-align: middle;
        width: 12px;
        height: 12px;
        margin-top: -3px;
        margin-left: 5px;
        display: inline-block;
        animation: spin 1s linear infinite;
      }

      ul {
        list-style-type: none;
        padding: 4px 0;
        margin: 0;
      }

      li {
        padding: 0.3em 0.7em;
        color: $theme_color;
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        width: 100%;
        &:hover {
          background: mix($theme_color, white, 10%);
        }
      }

      // .search-not-found {
      //   margin: 4px 0;
      // }

      .section {
        font-weight: bold;
        color: black;
        &:not(:first-child) {
          border-top: 1px solid mix($theme_color, white, 20%);
          margin-top: 3px;
          padding-top: 3px;
        }
      }
    }

    div.spring {
      flex-grow: 1;
      flex-shrink: 1;
      @include respond-to(phone) {
        display: none;
      }
    }

    div.mobile-drawer-overlay, div.mobile-drawer {
      @include respond-to(tablet) { display: none; }
      @include respond-to(laptop) { display: none; }

      margin: 0;
      position: fixed;
      box-sizing: border-box;
      top: 50px; left: 0; bottom: 0;
      transition: all ease 0.2s;
    }

    div.mobile-drawer {
      width: 260px;
      transform: translateX(-260px);
      overflow-y: scroll;
      -webkit-overflow-scrolling: touch;
      background: white;
      padding: 10px;
      pointer-events: none;

      &.active {
        transform: initial;
        pointer-events: initial;
      }
    }

    div.mobile-drawer-overlay {
      width: 100vw;
      pointer-events: none;

      &.active {
        background: rgba(black, 0.3);
        pointer-events: initial;
      }
    }

    div.drawer-trigger {
      @include respond-to(tablet) { display: none; }
      @include respond-to(laptop) { display: none; }

      width: 30px;
      height: 50px;
      padding: 15px 5px;
      box-sizing: border-box;
      font-size: 0;

      svg {
        width: 20px;
        height: 20px;
      }
      
      g {
        fill: white;
        fill-opacity: 0.8;
        stroke: none;
      }
    }
  }
}

.light-theme {
  div.st-header {
    background-color: $theme_color;
    // box-shadow: 0 2px 2px $theme_color;
    a {
      color: $link_color;
    }
    a:hover {
      color: white;
    }
    input {
      background: darken($theme_color, 12%);
    }
    input:focus {
      background: darken($theme_color, 18%);
    }
    input::placeholder {
      color: $link_color;
    }
  }
}

.dark-theme {
  div.st-header {
    background-color: #555;
    // box-shadow: 0 2px 2px #555;
    a {
      color: #bbb;
    }
    a:hover {
      color: #fff;
    }
    input {
      background: #333;
    }
    input:focus {
      background: #222;
    }
    input::placeholder {
      color: #bbb;
    }
    button.notification {
      filter: grayscale(100%);
    }
  }
}
</style>
