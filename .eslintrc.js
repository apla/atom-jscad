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
    "no-unused-vars": 0,
    "indent": [
            "error",
            2,
      {
        "SwitchCase": 1
      }
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
