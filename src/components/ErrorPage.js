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
              href="https://docs.google.com/forms/d/e/1FAIpQLSdBHeVvdU92fc8vsqRuvx5uWuYQFsW8U3Co5HDIusH8YEH_VA/viewform?usp=pp_url&entry.1591633300=Bug+Report"
              target="_blank"
            >
              <span> leaving feedback</span>
            </a>
            .
          </p>
        </EmptyState>
      </div>
    </React.Fragment>
  );
}
