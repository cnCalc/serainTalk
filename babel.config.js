module.exports = {
  'presets': [
    ['@babel/preset-env', { 'modules': false }],
  ],
  'plugins': [
    '@babel/plugin-syntax-dynamic-import',
    '@babel/plugin-transform-regenerator',
  ],
  'env': {
    'test': {
      'plugins': [
        'istanbul',
        '@babel/plugin-syntax-dynamic-import',
        '@babel/plugin-transform-regenerator',
      ],
    },
  },
};