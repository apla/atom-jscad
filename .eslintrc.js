module.exports = {
  "env": {
    "browser": true,
    "commonjs": true,
    "node": true
  },
  "extends": "eslint:recommended",
  "globals": {
    "atom": true
  },
  "rules": {
    "indent": [
            "error",
            2
        ],
    "linebreak-style": [
            "error",
            "unix"
        ],
    "quotes": [
            "error",
            "single"
        ],
    "semi": [
            "error",
            "always"
        ]
  }
};
