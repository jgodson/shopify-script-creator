import React from 'react';
import {AppProvider} from '@shopify/polaris';
import ReactDOM from 'react-dom';
import bugsnag from '@bugsnag/js'
import bugsnagReact from '@bugsnag/plugin-react'
import Versions from './versions';
import InfoBanner from './components/InfoBanner';
import ErrorPage from './components/ErrorPage'
import App from './App';

import '@shopify/polaris/styles.css';

// Set up bugsnag to capture errors
const bugsnagClient = bugsnag({
  apiKey: 'b5c7553f622953ed2e930932c74bd43d',
  notifyReleaseStages: ['production'],
  appVersion: Versions.currentVersion,
});
bugsnagClient.use(bugsnagReact, React);
const ErrorBoundary = bugsnagClient.getPlugin('react');

ReactDOM.render(
  <AppProvider>
    <ErrorBoundary FallbackComponent={ErrorPage}>
      <InfoBanner />
      <App />
    </ErrorBoundary>
  </AppProvider>,
  document.getElementById('root')
);
