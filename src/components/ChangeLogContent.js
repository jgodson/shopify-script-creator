import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>

      <li>The "Cart has no discount codes" Cart Qualifier has been renamed to "Exclude Discount Codes" due to additional functionality. It will work the same as previously without any changes, but you can now specify whether specific codes are allowed/not allowed to combine with the additional options</li>

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
