import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>

      <li>18.0 - The <b>Cart/Item subtotal</b> qualifier now has options to check the difference between the original cart or item subtotal and the current subtotal. This allows you to conditionally apply a discount based on if the discounts applied by scripts are greater than/less than, etc, a specific amount. Also fixed a bug in this qualifier where the <b>Qualified item subtotal</b> was added together using the original line price instead of the current line price</li>

      </ul>

      <div style={{paddingTop: '2rem'}}>
        <Stack distribution="trailing">
          <Link url="https://github.com/jgodson/shopify-script-creator/releases">
            View previous releases
          </Link>
        </Stack>
      </div>
    </div>
  );
}
