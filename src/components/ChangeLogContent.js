import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>

      <li>16.0 - Added a new <b>Cart Qualifier</b> called <b>Cart Has Items</b> that allows you to check if the cart has a specific quantity or subtotal of specified items</li>
      <li>16.1 - Added an error page when an error occurs and a banner clarifying that Shopify does not offer support for this app</li>

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
