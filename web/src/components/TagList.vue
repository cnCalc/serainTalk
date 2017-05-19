<template lang="pug">
  div.tag-list
    div.tag-list-item.link(@click="switchTagMode", v-bind:class="{disabled: listUpdating}")
      span.tag-icon(style="opacity: 0")
      | {{ switchButtonText }}
    div.tag-list-item.link(v-bind:class="{disabled: !listWillUpdate}" @click="commit", style="margin-bottom: 1em;")
      span.tag-icon(style="opacity: 0")
      | 刷新帖子列表
    div.tag-list-item.link(v-for="(tag, index) in tagsList" @click="updateFilter(index)" v-bind:class="{'before-insert': tag.hide}")
      span.tag-icon.active(v-if="tag.active")
      span.tag-icon(v-else)
      | {{ tag.name }}
</template>

<script>
import config from '../config';
import store from '../store';

export default {
  name: 'tag-list',
  data () {
    return {
      tagsList: [],
      tagMode: 'pinned',
      listUpdating: false,
      listWillUpdate: false,
    };
  },
  created () {
    this.loadTagList();
  },
  methods: {
    updateFilter (index) {
      this.tagsList[index].active = !this.tagsList[index].active;
      this.listWillUpdate = true;
    },
    switchTagMode () {
      if (this.listUpdating) {
        return;
      }
      if (this.tagMode === 'pinned') {
        this.tagMode = 'all';
      } else {
        this.tagMode = 'pinned';
      }
      this.loadTagList();
    },
    loadTagList () {
      let url;
      this.listUpdating = true;
      this.listWillUpdate = false;
      this.tagsList = [];
      if (this.tagMode === 'pinned') {
        url = `${config.api.url}${config.api.version}/tags/pinned`;
      } else {
        url = `${config.api.url}${config.api.version}/tags`;
      }
      this.$http.get(url).then(res => {
        if (res.body.status === 'ok') {
          this.tagsList = res.body.tags.map(tag => {
            return {
              name: tag,
              active: false,
              hide: true,
            };
          });
          let offset = 0;
          let intervalId = setInterval(() => {
            this.tagsList[offset++].hide = false;
            if (offset === this.tagsList.length) {
              this.listUpdating = false;
              clearInterval(intervalId);
            }
          }, 25);
        }
      });
    },
    commit () {
      store.commit('setTags', this.tagsList.filter(el => el.active).map(el => el.name));
      this.listWillUpdate = false;
    }
  },
  computed: {
    switchButtonText () {
      if (this.tagMode === 'pinned') {
        return '切换至所有标签';
      } else {
        return '切换至常用标签';
      }
    }
  }
};
</script>

<style lang="scss">
@import '../styles/global.scss';

div.tag-list {
  margin-top: 20px;
  text-align: left;
  width: 90%;
  span.tag-icon {
    background-color: rgba(0, 0, 0, 0);
    transition: background ease 0.1s;
    border: 3px solid $theme_color;
    box-sizing: border-box;
    vertical-align: center;
    display: inline-block;
    margin-left: 0.5em;
    margin-right: 0.5em;
    width: 0.9em;
    height: 0.9em;
    border-radius: 0.45em;
  }
  span.tag-icon.active {
    background-color: $theme_color;
  }
  div.tag-list-item {
    font-size: 0.9em;
    line-height: 2.25em;
    color: $theme_color;
    margin-top: 0.2em;
    border-radius: 4px;
    transition: all ease 0.2s;
  }
  div.tag-list-item.before-insert {
    transform: translateX(-30px);
    opacity: 0;
  }
  div.tag-list-item:hover {
    background: rgba(0, 0, 0, 0.1)
  }
  div.link.disabled {
    color: grayscale($theme_color);
    cursor: default;
  }
  div.link.disabled:hover {
    background: rgba(0, 0, 0, 0);
  }
}
</style>
