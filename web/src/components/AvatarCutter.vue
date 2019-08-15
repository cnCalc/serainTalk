<template lang="pug">
  div.member-upload-avatar(v-show="$route.params.memberId === $store.state.me._id")
    h3 上传头像
    input(type="file", style="display: none", v-on:change="startPreview($event)")
    div.avatar-picker
      div.picker
        button.button(@click="selectAvatarFile", v-if="localImageUrl === ''") 单击选择图片
        div.cut-tool(v-else)
          img(:src="localImageUrl" draggable="false")
          div.cut-indicator(v-bind:style="cutIndicatorStyle" v-on:mousedown="beginDrag" v-on:touchstart="beginDrag")
          input.scale(type="range" min="10" max="100" setp="5" v-model="cutState.scale")
      //- div.preview
      //-   div.avatar
      //-     div.avatar-image(v-if="member.avatar" v-bind:style="{ backgroundImage: 'url(' + member.avatar + ')'}")
      //-     div.avatar-fallback(v-else) {{ (member.username || '?').substr(0, 1).toUpperCase() }}
      //-   span.info 当前头像
    div.button-container(v-if="localImageUrl !== ''")
      button.button(@click="selectAvatarFile") 重新选择
      button.button(@click="uploadAvatar") 确定提交

</template>

<script>
import axios from 'axios';
import api from '../api';

export default {
  data () {
    return {
      localImageUrl: '',
      cutIndicatorStyle: {},
      cutState: {
        scale: 100,
      },
      dragState: {
        beginMouseX: 0,
        beginMouseY: 0,
        beginIndicatorX: 0,
        beginIndicatorY: 0,
      },
    };
  },
  watch: {
    'cutState.scale': function () {
      const maxSize = Math.min(this.cutState.showingWidth, this.cutState.showingHeight);
      const diff = (maxSize * Number(this.cutState.scale) / 100 - this.cutState.size) / 2;
      this.cutState.size = maxSize * Number(this.cutState.scale) / 100;
      this.cutState.x -= diff;
      this.cutState.y -= diff;
      this.updateCutIndicatorStyle();
    },
  },
  methods: {
    beginDrag (e) {
      this.dragState.beginMouseX = e.clientX || e.changedTouches[0].clientX;
      this.dragState.beginMouseY = e.clientY || e.changedTouches[0].clientY;
      this.dragState.beginIndicatorX = this.cutState.x;
      this.dragState.beginIndicatorY = this.cutState.y;
      document.addEventListener('mousemove', this.dragStep);
      document.addEventListener('touchmove', this.dragStep);
      document.addEventListener('mouseup', this.dragStop);
      document.addEventListener('touchend', this.dragStop);
    },
    dragStep (e) {
      e.preventDefault();
      this.cutState.x = this.dragState.beginIndicatorX + ((e.clientX || e.changedTouches[0].clientX) - this.dragState.beginMouseX);
      this.cutState.y = this.dragState.beginIndicatorY + ((e.clientY || e.changedTouches[0].clientY) - this.dragState.beginMouseY);
      this.updateCutIndicatorStyle();
    },
    dragStop (e) {
      document.removeEventListener('mousemove', this.dragStep);
      document.removeEventListener('touchmove', this.dragStep);
      document.removeEventListener('mouseup', this.dragStop);
      document.removeEventListener('touchend', this.dragStop);
    },
    selectAvatarFile () {
      this.$el.querySelector('input[type="file"]').click();
    },
    updateCutIndicatorStyle () {
      const maxSize = Math.min(this.cutState.showingWidth, this.cutState.showingHeight);
      if (this.cutState.size > maxSize) {
        this.cutState.size = maxSize;
      }
      if (this.cutState.x < 0) this.cutState.x = 0;
      if (this.cutState.y < 0) this.cutState.y = 0;
      if (this.cutState.x + this.cutState.size > this.cutState.showingWidth) this.cutState.x = this.cutState.showingWidth - this.cutState.size;
      if (this.cutState.y + this.cutState.size > this.cutState.showingHeight) this.cutState.y = this.cutState.showingHeight - this.cutState.size;
      this.cutIndicatorStyle = {
        top: this.cutState.y + this.cutState.topOffset + 'px',
        left: this.cutState.x + this.cutState.leftOffset + 'px',
        width: this.cutState.size + 'px',
        height: this.cutState.size + 'px',
        backgroundImage: `url(${this.localImageUrl})`,
        backgroundSize: `${this.cutState.showingWidth}px ${this.cutState.showingHeight}px`,
        backgroundPosition: `${-this.cutState.x}px ${-this.cutState.y}px`,
      };
    },
    startPreview (event) {
      const input = this.$el.querySelector('input[type="file"]');
      const previewSize = 320;

      if (input.files && input.files[0]) {
        const blob = new window.Blob([input.files[0]]);
        this.localImageUrl = window.URL.createObjectURL(blob);

        setTimeout(() => {
          const image = this.$el.querySelector('img');

          this.cutState.imgWidth = image.naturalWidth;
          this.cutState.imgHeight = image.naturalHeight;

          let ratio = this.cutState.ratio = previewSize / Math.max(this.cutState.imgWidth, this.cutState.imgHeight);

          let showingWidth = this.cutState.showingWidth = this.cutState.imgWidth * ratio;
          let showingHeight = this.cutState.showingHeight = this.cutState.imgHeight * ratio;

          this.cutState.leftOffset = (previewSize - showingWidth) / 2;
          this.cutState.topOffset = (previewSize - showingHeight) / 2;
          this.cutState.x = 0;
          this.cutState.y = 0;
          this.cutState.size = Math.min(showingWidth, showingHeight);

          this.updateCutIndicatorStyle();
        }, 200);
      }
    },
    uploadAvatar () {
      let source = axios.CancelToken.source();
      this.$store.dispatch('showMessageBox', {
        title: '上传中',
        type: 'CANCEL',
        message: '正在上传（0%）',
      }).catch(() => {
        source.cancel('用户取消上传');
      });
      api.v1.member.uploadAvatar({
        file: this.$el.querySelector('input[type="file"]').files[0],
        x: Math.floor(this.cutState.x / this.cutState.ratio),
        y: Math.floor(this.cutState.y / this.cutState.ratio),
        w: Math.floor(this.cutState.size / this.cutState.ratio),
      }, {
        onUploadProgress: e => {
          this.$store.dispatch('updateMessageBox', {
            title: '上传中',
            message: `正在上传（${(100 * e.loaded / e.total).toFixed(2)}%）`,
          });
        },
        cancelToken: source.token,
      }).then(() => {
        this.$store.dispatch('disposeMessageBox');
        return this.$store.dispatch('showMessageBox', {
          title: '上传成功',
          type: 'OK',
          message: '文件上传成功，您的头像已经更新。',
        }).then(() => {
          window.history.go(-1);
          this.reloadMemberInfo();
        });
      }).catch(error => {
        this.$store.dispatch('disposeMessageBox');
        console.error(error);
        this.bus.$emit('notification', {
          type: 'error',
          body: error.message,
        });
      });
    },
    reloadMemberInfo () {
      this.$store.dispatch('fetchCurrentSigninedMemberInfo');
      this.$store.dispatch('fetchMemberInfo', { id: this.$route.params.memberId }).then(() => {
        // this.updateTitle();
      });
    },
  },
};
</script>

<style lang="scss">
@import '../styles/global.scss';
@import '../styles/load-more-button.scss';

div.member-upload-avatar {
  user-select: none;

  button.button {
    border: none;
    font-size: 14px;
  }

  div.avatar-picker {
    display: flex;
  }

  $box-size: 320px;
  $margin-len: 70px;

  div.button-container {
    display: flex;
    width: $box-size;
    padding: 1em;
    box-sizing: border-box;
    justify-content: space-around;
    button {
      padding-left: 1em;
      padding-right: 1em;
    }
  }

  div.picker, div.preview {
    width: $box-size;
    height: $box-size;
    line-height: $box-size;
    text-align: center;
  }
  div.picker {
    button.button {
      padding: 1em 2em;
    }

    div.cut-tool {
      position: relative;
      width: 100%;
      height: 100%;
      background: black;

      img {
        position: absolute;
        margin: auto;
        top: 0; left: 0;
        right: 0; bottom: 0;
        max-width: 100%;
        max-height: 100%;
        filter: brightness(0.5);
      }

      input.scale {
        position: absolute;
        z-index: 5;
        transform: rotate(-90deg) translateX(-160px) translateY(120px);
        transform-origin: center;
      }

      div.button-container {
        position: absolute;
        margin: auto;
        top: 0; left: 0;
        right: 0; bottom: 0;
      }
    }

    div.cut-indicator {
      touch-action: none;
      position: absolute;
      border-radius: 50%;
    }
  }

  div.preview {
    position: relative;
    .avatar, .avatar-image, .avatar-fallback {
      width: $box-size - $margin-len * 2;
      height: $box-size - $margin-len * 2;
      line-height: $box-size - $margin-len * 2;
    }
    .avatar {
      margin: $margin-len;
      border-radius: ($box-size - $margin-len) / 2;
      overflow: hidden;
    }
    .avatar-image {
      background-size: cover;
    }
    .avatar-fallback {
      background-color: $theme_color;
    }
    span.info {
      position: absolute;
      user-select: none;
      line-height: 1em;
      bottom: 20px;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 14px;
      color: #888;
    }
  }
}
</style>
