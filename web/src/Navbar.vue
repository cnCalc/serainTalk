<template lang="pug">
  div.st-header
    div.container
      h1: router-link(to="/" title="cnCalc") cnCalc.org
      div.links.left
        template(v-for="link in links")
          a(v-if="link.external" :href="link.href" target="_blank" :title="link.text") {{ link.text }}
          router-link(v-else :to="link.href" :title="link.text") {{ link.text }}
      div.links.right
        div.input
          input(type="text", placeholder="搜索")
        router-link(to="/signup" title="注册") 注册
        router-link(to="/signin" title="登录") 登录
</template>

<script>
export default {
  name: 'navbar',
  data () {
    return {
      links: [
        // { href: '/', external: false, text: '首页' },
        { href: 'https://github.com/cnCalc', external: true, text: 'GitHub' },
        { href: 'http://tieba.baidu.com/f?kw=fx%2Des%28ms%29', external: true, text: 'fx-es(ms) 吧' },
      ]
    };
  }
}
</script>

<style lang="scss">
@import './global.scss';

div.st-header {
  display: block;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 50px;
  background-color: rgba($theme_color, 0.95);
  box-shadow: 0 2px 2px $theme_color;
  text-align: center;

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
      // float: right;
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
      color: $link_color;
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

    div.input {
      display: inline-block;
      input, input:active {
        border: none;
        outline-width: 0;
      }
      input:focus {
        width: 250px;
        background: darken($theme_color, 12%);
      }
      input {
        background: darken($theme_color, 6%);
        padding: 7px;
        border-radius: 4px;
        color: white;
        width: 150px;
        transition: all ease 0.3s;
        margin-right: 0.5em;
      }
      @media screen and (max-width: $width-medium) {
        input {
          width: 30px;
        }
        input:focus {
          width: 150px;
        }
      }
      input::placeholder {
        color: $link_color;
      }
    }
  }
}
</style>