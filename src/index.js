import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';

const ErrorBoundary = bugsnagClient.use(bugsnag__react(React));

ReactDOM.render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
  document.getElementById('root')
);
