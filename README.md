# Shopify Script Creator
This project was intended to be a UI to generate Ruby code to paste into the Shopify Script Editor application, no extra coding needed.

## Dependencies
- [node](https://nodejs.org/en/)
- [yarn](https://github.com/yarnpkg/yarn/)

## CI
- CI is set up on [CircleCI](https://circleci.com)
- CI will run Rspec tests to test ruby code within the ruby_scripts directory
- CI will check to ensure that no changes were made to the `ruby_scripts` that have not been transferred to the respective `.js` files.

# Getting started
## Installation

Clone this project and install all the project dependencies.

```
yarn install
```

## Development
### JavaScript/React
Run the local `webpack` development server.

```
yarn start
```

Open http://localhost:8080 in your browser and you should see the application running.

### Ruby Scripts
- All scripts are cotained in the `ruby_scripts` directory and orgained by type of script (or common if they are applicable to all types of scripts)
- Tests for scripts are contained within the `spec` directory, then (similar to the script itself) another directory based on the type of script

- If you make changes to any scripts within the `ruby_scripts` directory, you will need to ensure these changes are added to the `src/scripts` `.js` file as well. The command for this is:
  ```
  yarn build:scripts
  ```

## Tests
#### Ruby
- Ruby is tested using [Rspec](https://rspec.info)
- [Factorybot](https://github.com/thoughtbot/factory_bot) is used for building the required objects for tests
- The `models` directory contains classes to simulate the environment that scripts are executed in.
- Tests can be run with

  ```
  yarn test:ruby
  ```

#### JavaScript
- There are currently no tests written for this 🙁

## Deploying
- Update the version in `src/versions.js` and `package.json` prior to deploying
- Ensure any significant changes to the `components/ChangeLogContent.js` file (you can [convert markdown to html](https://www.browserling.com/tools/markdown-to-html)).
- Deployment scripts are preconfigured in `package.json` to run with one easy command:
  ```
  yarn deploy
  ```
  This generates a `docs` directory containing `index.html` and `bundle.js`. The index loads all Polaris styles via the Polaris CDN and the application scripts via `bundle.js`
- Finally, add a release on GitHub for the new version with the same changes that were listed in the `ChangeLogContent.js` file.
