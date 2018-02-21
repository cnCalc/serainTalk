import Vue from 'vue';
import io from 'socket.io-client';
import store from '../store';

const wsEventBus = new Vue({
  data () {
    return {
      socket: null,
    };
  },
  created () {
    setTimeout(() => this.createConnection(), 1000);
    this.$on('reconnect', () => {
      this.destroyConnection();
      this.createConnection();
    });
  },
  methods: {
    createConnection () {
      let token = document.cookie.match(/membertoken=([^\;]+)/);

      if (token && token[1]) {
        token = token[1];
      } else {
        token = undefined;
      }

      const socket = this.socket = io.connect(window.location.origin, {
        path: '/api/ws',
        query: token ? { token } : {},
      });

      socket.on('connection', () => {
        this.$emit('notification', '与服务器连接成功！');
      });

      socket.on('notification', res => {
        this.$emit('notification', {
          type: 'message',
          body: res.content,
          href: res.href,
          emitter: 'server',
        });
      });

      socket.on('message', payload => {
        this.$emit('message', payload);
        if (payload.messageId !== store.state.messageSession) {
          this.$emit('notification', { type: 'message', body: '您有一条新消息，点击此处查看', href: `/message/${payload.messageId}` });
        }
      });

      socket.on('event', payload => {
        this.$emit('event', payload);
      });

      socket.on('failure', res => {
        if (res.code === 'NEED_LOGIN') {
          this.$emit('notification', {
            type: 'error',
            body: '无法与服务器建立 WebSocekt 连接，请重新登录！',
          });
        }
      });
    },
    destroyConnection () {
      if (this.socket) {
        this.socket.disconnect();
      }
    },
  },
});

export default wsEventBus;
