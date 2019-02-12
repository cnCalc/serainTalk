module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "mocha": true,
        "browser": true,
    },
    "parserOptions": {
        "parser": "babel-eslint",
        "ecmaVersion": 2017,
        "allowImportExportEverywhere": true
    },
    "extends": [
        'plugin:vue/recommended'        
    ],
    "plugins": [
        "standard",
        "promise",
        "babel",
        "vue"
    ],
    "rules": {
        "indent": [
            "error",
            2,
            { SwitchCase: 1 }
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "object-curly-spacing": [
            "error",
            "always"
        ],
        "no-console": 0,
        "comma-dangle": ["error", {
            "arrays": "always-multiline",
            "objects": "always-multiline",
            "imports": "always-multiline",
            "exports": "always-multiline",
            "functions": "ignore",
        }],
        "prefer-const": 0,
        "operator-linebreak": ["error", "before"]
    },
    "globals": {
        "angular": false,
        "module": false,
        "inject": false
    }
};