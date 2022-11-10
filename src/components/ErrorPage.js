import React from 'react';
import errorImage from '../images/error.png';
import { EmptyState } from '@shopify/polaris';
import InfoBanner from './InfoBanner';

export default function ErrorPage() {
  return (
    <React.Fragment>
      <InfoBanner />
      <div style={{margin: 'auto', maxWidth: '800px'}}>
        <EmptyState
          heading="Something went wrong"
          action={{content: 'Reload Page', onAction: () => window.location.reload()}}
          image={errorImage}
        >
          <p>
            An error occured. To help fix it, let me know how it occured by
            <a
              href="https://github.com/jgodson/shopify-script-creator/issues/new"
              target="_blank"
            >
              <span> creating an issue on GitHub</span>
            </a>
            .
          </p>
        </EmptyState>
      </div>
    </React.Fragment>
  );
}
