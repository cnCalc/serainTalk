<template lang="pug">
  .mingration-view: .mingration-box
    h2 账户迁移
    .verify-step(v-if="step === 'verify'")
      .explain 这里是一段解释说明文本
      label.block(for="origUserName") 原 cnCalc 用户名：
      input(type="text" id="origUserName" v-model="origUserName")
      label.block(for="origPasswd") 原 cnCalc 密码：
      input(type="password" id="origPasswd" v-model="origPasswd")
      label.block(for="email") 新的邮箱地址：
      input(type="text" id="email" v-model="email")
      button.button(@click="doVerifyRequest") 下一步
    .perform-step(v-else)
      .explain 验证码已发送，请前往邮箱查看。
      label.block(for="name") 新用户名（不可再修改）：
      input(type="text" id="name" v-model="name")
      label.block(for="passwd") 密码：
      input(type="password" id="passwd" v-model="passwd")
      label.block(for="repeatPasswd") 确认密码：
      input(type="password" id="repeatPasswd" v-model="repeatPasswd")
      button.button 完成迁移
</template>

<script>
import api from '../api';

export default {
  name: 'migration-view',
  data () {
    return {
      origUserName: '',
      origPasswd: '',
      email: '',
      name: '',
      passwd: '',
      repeatPasswd: '',
      step: 'verify',
    }
  },
  methods: {
    doVerifyRequest () {
      const payload = {
        name: this.origUserName,
        password: this.origPasswd,
        email: this.email,
      };
      api.v1.migration.requestMigration(payload).then(response => {
        this.step = 'perform';
      }).catch(e => {
        console.error(e);
        switch (e.response.status) {
        case 404:
          alert('用户不存在的。');
          break;
        case 400:
          alert('密码好像不对啊。');
          break;
        }
      })
    }
  }
}
</script>


<style lang="scss">
@import '../styles/global.scss';

div.mingration-view {
  font-size: 13px;

  div.mingration-box {
    text-align: left;
    display: inline-block;
    margin: 100px auto 0 auto;
  }

  h2 {
    font-size: 2em;
    font-weight: normal;
    text-align: left;
    margin-bottom: 0.25em;
  }

  .explain {
    margin-top: 1em;
    margin-bottom: 1em;
  }

  input[type="text"], input[type="password"] {
    width: 300px;
    border-radius: 2px;
    font-size: 1em;
    padding: 6px 8px;
    border: 1px solid #ccc;
  }

  input:focus {
    outline: none;
  }

  label {
    margin-top: 20px;
  }

  label.block {
    display: block;
  }

  button.button {
    margin: 20px 0;
    width: 100%;
    border: none;
    display: block;
    background-color: $theme-color;
    color: white;
  }
}
</style>
