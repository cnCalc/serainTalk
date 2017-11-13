<template lang="pug">
  div.st-header
    div.container
      router-link(to="/" title="cnCalc"): h1 cnCalc.org
      div.links
        template(v-for="link in links")
          a(v-if="link.external" :href="link.href" target="_blank" :title="link.text") {{ link.text }}
          router-link(v-else :to="link.href" :title="link.text") {{ link.text }}
      div(style="flex-grow: 1; flex-shrink: 1;")
      a.theme-switch(@click="switchTheme")
        span(v-if="$store.state.theme !== 'dark'") 夜间模式
        span(v-else) 正常模式
      div.input
        input(type="text", placeholder="搜索")
      div(v-if="typeof me._id === 'undefined'")
        router-link.right(:to="`/signup?next=${encodeURIComponent(path)}`" title="注册") 注册
        router-link.right(:to="`/signin?next=${encodeURIComponent(path)}`" title="登录") 登录
      div(v-else)
        div.avatar(@click="dropdownMenuTrigger")
          div.avatar-image(v-if="me.avatar !== null" v-bind:style="{ backgroundImage: 'url(' + me.avatar + ')'}")
          div.avatar-fallback(v-else) {{ (me.username || '?').substr(0, 1).toUpperCase() }}
        div.menu-wrapper: div.menu(v-bind:style="{ opacity: isMenuOpened ? 1 : 0, transform: `translateY(${ isMenuOpened ? '0px' : '-6px' })`, pointerEvents: isMenuOpened ? '' : 'none' }"): ul
          li.member: router-link(:to="`/m/${me._id}`") 我的主页
          li.settings: a 个人设置
          li.signout: a(@click="signout") 退出登录
</template>

<script>
import api from '../api';

export default {
  name: 'nav-bar',
  data () {
    return {
      links: [
        // { href: '/', external: false, text: '首页' },
        { href: 'https://github.com/cnCalc', external: true, text: 'GitHub' },
        { href: 'http://tieba.baidu.com/f?kw=fx%2Des%28ms%29', external: true, text: 'fx-es(ms) 吧' },
      ],
      isMenuOpened: false
    };
  },
  computed: {
    path () {
      return this.$route.fullPath;
    },
    me () {
      return this.$store.state.me;
    }
  },
  methods: {
    switchTheme () {
      this.$store.commit('switchTheme');
    },
    stopPropagation (e) {
      e.stopPropagation();
    },
    dropdownMenuDeactivate (e) {
      this.isMenuOpened = false;
      document.removeEventListener('click', this.dropdownMenuDeactivate);
    },
    dropdownMenuActivate () {
      this.isMenuOpened = true;
      document.addEventListener('click', this.dropdownMenuDeactivate);
    },
    dropdownMenuTrigger (e) {
      e.stopPropagation();
      (this.isMenuOpened ? this.dropdownMenuDeactivate : this.dropdownMenuActivate)();
    },
    signout () {
      api.v1.member.signout().then(() => {
        // refresh
        window.location.href = window.location.href;
      });
    }
  }
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
  text-align: center;
  z-index: 10;

  a.theme-switch {
    cursor: pointer;
  }

  div.container {
    text-align: left;
    height: 50px;
    vertical-align: top;
    padding-left: 15px;
    white-space: nowrap;
    position: relative;
    display: flex;
    align-items: center;

    h1 {
      display: inline-block;
      font-size: 1.5em;
      color: white;
      padding: 0; 
      margin: 0;
      font-weight: normal;
      line-height: 50px;
    }

    a.right {
      margin-right: 10px;
      transition: color ease 0.3s;
    }

    div.links {
      margin-left: 7px;
    }

    @media screen and (max-width: $width-small) {
      div.left.links {
        display: none;
      }
    }

    div.links {
      display: inline-block;
      font-size: 0.9em;
      vertical-align: top;
      line-height: 50px;
      a {
        transition: color ease 0.3s;
        display: inline-block;
        min-width: 40px;
        margin-left: 5px;
        margin-right: 5px;
        text-align: center;
        border-radius: 2px;
      }
    }

    a.theme-switch {
      display: inline-block;
      cursor: pointer;
    }

    div.input {
      display: inline-block;
      margin: 0 10px;
      input, input:active {
        border: none;
        outline-width: 0;
      }
      input:focus {
        width: 250px;
      }
      input {
        padding: 7px;
        border-radius: 4px;
        color: white;
        width: 150px;
        transition: all ease 0.3s;
        margin-right: 0.5em;
        margin-left: 0.5em;
      }
      @media screen and (max-width: $width-medium) {
        input {
          width: 30px;
        }
        input:focus {
          width: 150px;
        }
      }
    }

    $avatar_width: 30px;
    $avatar_height: 30px;
    div.avatar {
      width: $avatar_width;
      height: $avatar_height;
      border-radius: $avatar_width / 2;
      overflow: hidden;
      cursor: pointer;

      .avatar-image {
        width: $avatar_width;
        height: $avatar_height;
        background-size: cover;
      }
    }

    div.menu-wrapper {
      width: 0;
      height: 0;
      position: relative;
      display: block;
    }

    div.menu {
      $width: 150px;
      position: absolute;
      top: 8px;
      // left: -$width / 2 + $avatar_width / 2;
      right: -$avatar_width;
      width: $width;
      background: white;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
      border-radius: 4px;

      transition: all ease 0.2s;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 10px 0;
    }

    li {
      text-align: center;
      font-size: 0.9em;
      height: 2.2em;
      line-height: 2.2em;

      a {
        color: mix($theme_color, black, 80%);
        cursor: pointer;
      }

      a:hover {
        color: mix($theme_color, black, 80%);
      }
    }

    li:hover {
      background-color: mix($theme_color, white, 10%);
    }

    li::before {
      content: '';
      display: inline-block;
      background-size: cover;
      width: 1em;
      height: 1em;
      margin-right: .5em;
      vertical-align: baseline;
    }

    li::after {
      content: '';
      display: inline-block;
      width: 0.5em;
    }

    li.member::before {
      background-image: url(../assets/member.svg);
    }

    li.settings::before {
      background-image: url(../assets/settings.svg);
    }

    li.signout::before {
      background-image: url(../assets/signout.svg);
      // Fix to baseline
      margin-bottom: -2px;
    }
  }
}

.light-theme {
  div.st-header {
    background-color: $theme_color;
    box-shadow: 0 2px 2px $theme_color;
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
    box-shadow: 0 2px 2px #555;
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
  }
}
</style>
