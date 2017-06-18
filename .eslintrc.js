module.exports = {
    "env": {
        "es6": true,
        "node": true,
        "mocha": true
    },
    "parserOptions": {
        "ecmaVersion": 8
    },
    "extends": "vue",
    "plugins": [
        "standard",
        "promise"
    ],
    "rules": {
        "indent": [
            "error",
            2
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": 0,
        "comma-dangle": 0,
        "prefer-const": 0,
    },
    "globals": {
        "angular": false,
        "module": false,
        "inject": false
    }
};