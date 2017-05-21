/*eslint no-return-assign: 0*/

import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: {},
    selectedTags: [],
    categoriesGroup: [],
    globalTitle: '',
    globalSubtitle: '',
    theme: 'light',
  },
  mutations: {
    setTags: (state, newTagList) => state.selectedTags = newTagList,
    setCategoriesGroup: (state, newCategoriesGroup) => state.categoriesGroup = newCategoriesGroup,
    setGlobalTitles: (state, [title, subtitle]) => {
      state.globalTitle = title || '';
      state.globalSubtitle = subtitle || '';
    },
    switchTheme: state => state.theme = (state.theme === 'dark' ? 'light' : 'dark'),
  },
});
