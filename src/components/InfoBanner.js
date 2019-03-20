import React from 'react';
import { Banner } from '@shopify/polaris';

export default class InfoBanner extends React.Component {
  constructor() {
    super();

    this.state = {
      dismissed: false
    };

    this.dismissBanner = this.dismissBanner.bind(this);
  }

  dismissBanner() {
    this.setState({dismissed: true});
  }

  render() {
    if (this.state.dismissed) {
      return null;
    }

    return (
      <div style={{marginRight: '80px'}} >
      <Banner
        status="info"

        onDismiss={this.dismissBanner}
      >
        <p>Please note that this app is not developed by Shopify. Please do not contact Shopify Support for help, instead use the <strong>Leave feedback</strong> link below.</p>
      </Banner>
      </div>
    )
  }
}
