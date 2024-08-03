import React from 'react';
import { Banner } from '@shopify/polaris';

export default class InfoBanner extends React.Component {
  constructor() {
    super();

    this.state = {
      dismissed: localStorage.getItem('developedBannerDismissed') === 'true' || false
    };

    this.dismissBanner = this.dismissBanner.bind(this);
  }

  dismissBanner() {
    this.setState({ dismissed: true });
    localStorage.setItem('developedBannerDismissed', 'true');
  }

  render() {
    if (this.state.dismissed) {
      return null;
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center' }} >
        <div style={{ marginRight: '80px', marginLeft: '80px', maxWidth: 'fit-content' }} >
          <Banner
            status="info"
            onDismiss={this.dismissBanner}
          >
            <p>Please note that this app is not developed by Shopify. Please do not contact Shopify Support for help.</p>
          </Banner>
        </div>
      </div>
    )
  }
}
