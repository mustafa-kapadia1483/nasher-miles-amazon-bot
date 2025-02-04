# nasher-miles-amazon-bot

Amazon bot for Nasher miles GRS

[deprecated] Given a list of ASIN(s), scrape product details from amazon business

Given a list of ASIN(s):

1. Get corresponding EAN using API from asin scope.
2. Get corresponding HSN, Tax Rate & HSN Description

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

## Project Setup

### Install

```bash
$ npm install
$ npx puppeteer browsers install chrome
```

### Development

#### Create a .env file. Add VITE_ASINSCOPE_API_KEY. Get api key from [asincope](https://asinscope.com/en/dashboard/asinscope-api)

```bash
$ npm run dev
```

### Build

```bash
# For windows
$ npm run build:win

# For macOS
$ npm run build:mac

# For Linux
$ npm run build:linux
```
