import React from 'react';
import { Banner, Link } from '@shopify/polaris';

export default class WarningBanner extends React.Component {
  constructor() {
    super();

    this.state = {
      dismissed: localStorage.getItem('warningBannerDismissed') === 'true' || false
    };

    this.dismissBanner = this.dismissBanner.bind(this);
  }

  dismissBanner() {
    this.setState({ dismissed: true });
    localStorage.setItem('warningBannerDismissed', 'true');
  }

  render() {
    if (this.state.dismissed) {
      return null;
    }

    return (
      <div style={{ display: 'flex', justifyContent: 'center' }} >
        <div style={{ marginRight: '80px', marginLeft: '80px', maxWidth: 'fit-content' }} >
          <Banner
            status="warning"
            onDismiss={this.dismissBanner}
          >
            <p>Shopify Scripts are deprecated and will be <Link external url='https://help.shopify.com/en/manual/checkout-settings/script-editor/migrating'>unavailable after June 30, 2026</Link>. Consider trying out the <Link external url='https://apps.shopify.com/checkout-blocks'>Checkout Blocks</Link> app.</p>
          </Banner>
        </div>
      </div>
    )
  }
}
