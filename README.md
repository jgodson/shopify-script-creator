# Shopify Script Creator
This project was intended to be a UI to generate Ruby code to paste into the Shopify Script Editor application, no extra coding needed.

## Dependencies
- [yarn](https://github.com/yarnpkg/yarn/) or [npm](https://www.npmjs.com/)

## Getting started
### Installation

Clone this project and install all the project dependencies.

**With Yarn**

```bash
yarn install
```

**With npm**

```bash
npm install
```

### Development
Run the local `webpack` development server.

**With Yarn**

```bash
yarn start
```

**With npm**

```bash
npm start
```

Open http://localhost:8080 in your browser and you should see the application running.

### Deploying
- Be sure to update the version in `src/versions.js` and `package.json` prior to deploying
- Commit and push your changes to the source repo. You don't need to build manually, this is done in the next step.
- Deployment scripts are preconfigured in `package.json` to run with one easy command.

**With Yarn**

```bash
yarn deploy
```

**With npm**

```bash
npm deploy
```

This generates a `docs` directory containing `index.html` and `bundle.js`. The index loads all Polaris styles via the Polaris CDN and the application scripts via `bundle.js`
