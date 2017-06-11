<template lang="pug">
  div.st-header
    div.container
      h1: router-link(to="/" title="cnCalc") cnCalc.org
      div.links.left
        template(v-for="link in links")
          a(v-if="link.external" :href="link.href" target="_blank" :title="link.text") {{ link.text }}
          router-link(v-else :to="link.href" :title="link.text") {{ link.text }}
      div.links.right
        a.theme-switch(@click="switchTheme")
          span(v-if="$store.state.theme !== 'dark'") 夜间模式
          span(v-else) 正常模式
        div.input
          input(type="text", placeholder="搜索")
        router-link(to="/signup" title="注册") 注册
        router-link(to="/signin" title="登录") 登录
</template>

<script>
export default {
  name: 'nav-bar',
  data () {
    return {
      links: [
        // { href: '/', external: false, text: '首页' },
        { href: 'https://github.com/cnCalc', external: true, text: 'GitHub' },
        { href: 'http://tieba.baidu.com/f?kw=fx%2Des%28ms%29', external: true, text: 'fx-es(ms) 吧' },
      ]
    };
  },
  methods: {
    switchTheme () {
      this.$store.commit('switchTheme');
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

    h1 {
      display: inline-block;
      font-size: 1.5em;
      color: white;
      padding: 0; 
      margin: 0;
      font-weight: normal;
      line-height: 50px;
    }

    div.right {
      position: absolute;
      right: 0;
    }

    div.left.links {
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
  }
}

.light-theme {
  div.st-header {
    background-color: $theme_color;
    box-shadow: 0 2px 2px $theme_color;
    div.links {
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
