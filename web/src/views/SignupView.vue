<template lang="pug">
  div.signup-view
    div.signup-box: form(v-on:submit.prevent="doSignup")
      h2 注册
      label.block(for="name") 用户名或电子邮件地址
      input(id="name", type="text", v-model="credentials.name", :readonly="busy" autocomplete="username")
      label.block(for="passwd") 密码
      input(id="passwd", type="password", v-model="credentials.password", :readonly="busy" autocomplete="current-password")
      button.button(@click="doSignin", :disabled="busy") 登录
      div.quick-action-wrapper
        router-link(to="/signin") 前往登录
        router-link(:to="`/migration?next=${encodeURIComponent($route.query.next || path)}`") 账户迁移
        router-link(to="/reset-password") 忘记密码
</template>

<script>
// import api from '../api';
import titleMixin from '../mixins/title';
// import bus from '../utils/ws-eventbus';

export default {
  name: 'singup-view',
  mixins: [titleMixin],
  data () {
    return {
      credentials: {
        name: '',
        password: '',
      },
      rememberMe: false,
    };
  },
  title: '注册',
  computed: {
    busy () {
      return this.$store.state.busy;
    },
    path () {
      return this.$route.fullPath;
    },
  },
  beforeMount () {
    this.$store.commit('setGlobalTitles', []);
  },
  mounted () {
    this.updateTitle();
  },
  methods: {
    doSignin () {
      window.alert('TODO');
    },
  },
};
</script>


<style lang="scss">
@import '../styles/global.scss';

div.signup-view {
  font-size: 13px;

  div.signup-box {
    text-align: left;
    display: inline-block;
    margin: 100px auto 0 auto;
    padding: 0 10px;
    width: 300px;
    box-sizing: border-box;
  }

  label.block {
    display: block;
  }

  label {
    text-align: initial;
    margin-top: 20px;
  }

  input[type="text"], input[type="password"] {
    width: 100%;
    box-sizing: border-box;
    border-radius: 2px;
    font-size: 1em;
    padding: 6px 8px;
  }

  input:focus {
    outline: none;
  }

  h2 {
    font-size: 2em;
    font-weight: normal;
    text-align: left;
  }

  div.remember-wrapper {
    margin-top: 5px;
  }

  button.button {
    margin: 20px 0;
    width: 100%;
    border: none;
  }

  a {
    margin-right: 1em;
  }

  a, label, input, h2 {
    transition: all ease 0.3s;
  }
}

.light-theme div.signup-view {
  input[type="text"], input[type="password"] {
    border: 1px solid #ccc;
  }

  button.button {
    background-color: $theme_color;
    color: white;

    &:disabled {
      background-color: mix(white, $theme_color, 50%);
    }
  }

  a {
    color: $theme_color;
  }

  label {
    color: black;
  }
}

.dark-theme div.signup-view {
  color: white;

  input[type="text"], input[type="password"] {
    border: 1px solid #444;
    background-color: #444;
    color: white;
  }

  button.button {
    background-color: #444;
    color: white;

    &:disabled {
      background-color: mix(black, #444, 25%);
      color: grey;
    }
  }

  a {
    color: #888;
  }

  label {
    color: white;
  }
}


</style>
