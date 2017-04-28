<template lang="pug">
  div.nav
    div.left
      div.button.create-discussion 创建新帖
      div.tag-list
        div.tag-list-item.link(v-for="(tag, index) in officialTags" v-on:click="updateFilter(tag.objectId, index)")
          span.tag-icon.active(v-if="tag.active")
          span.tag-icon(v-else)
          | {{ tag.name }}
        div.tag-list-item.link
          span.tag-icon(style="opacity: 0")
          | 查看所有标签
    div.right
</template>

<script>
export default {
  name: 'listview',
  data () {
    return {
      officialTags: [
        { name: '德州仪器', objectId: 'ti', active: true },
        { name: '卡西欧', objectId: 'casio', active: true },
        { name: '惠普', objectId: 'hp', active: true },
        { name: '图形计算器', objectId: 'g', active: true },
        { name: '函数计算器', objectId: 'f', active: true },
        { name: '站务讨论', objectId: 'wtf', active: true },
      ],
      selectedTags: [],
    }
  },
  created: function() {
    this.officialTags.forEach(tag => this.selectedTags.push(tag))
  },
  methods: {
    updateFilter: function(objectId, index) {
      if (this.officialTags[index].active) {
        this.officialTags[index].active = false;
      } else {
        this.officialTags[index].active = true;
      }
      this.$forceUpdate();
    }
  }
}
</script>

<style lang="scss">
@import './global.scss';

div.nav {
  white-space: nowrap;
  vertical-align: top;

  div.left {
    vertical-align: top;
    display: inline-block;
    width: 20%;
    height: 100px;
  }

  div.right {
    vertical-align: top;
    display: inline-block;
    width: 80%;
    text-align: left;
  }

  div.create-discussion {
    width: 90%;
    margin-left: 0%;
    background-color: $theme_color;
    color: white;
  }

  div.button:hover {
    background-color: darken($theme_color, 7%);
  }

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
      transition: background ease 0.2s;
    }
    div.tag-list-item:hover {
      background: rgba(0, 0, 0, 0.1)
    }
  }
}
</style>
