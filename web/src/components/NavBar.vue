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
      input.search(type="text", placeholder="搜索")
      template(v-if="typeof me._id === 'undefined'")
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

export default {
  name: 'nav-bar',
  components: {
    CategoryList, NotificationControl, MemberControl,
  },
  data () {
    return {
      links: [
        // { href: '/', external: false, text: '首页' },
        { href: 'https://github.com/cnCalc', external: true, text: 'GitHub' },
        { href: 'http://tieba.baidu.com/f?kw=fx%2Des%28ms%29', external: true, text: 'fx-es(ms) 吧' },
      ],
      isCategoryDrawerActivated: false,
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
  z-index: 10;

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

    input.search {
      border: none;
      padding: 5px;
      border-radius: 5px;
      color: white;
      transition: all ease 0.4s;
      min-width: 0;
      width: 180px;
      @include respond-to(phone) {
        flex-grow: 1;
        flex-shrink: 1;
        width: 100%;
      }

      &:focus {
        outline: none;
        width: 260px;
        @include respond-to(phone) {
          width: 100%;
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
