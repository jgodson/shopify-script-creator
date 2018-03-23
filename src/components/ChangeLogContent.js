import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3>Change Log</h3>

      <ul>
      <li>Add Discounted Cart Subtotal (applied by discount codes) to the cart qualifiers. This allows you to check the value of the cart after discount codes are applied. (Only for entire cart discount codes. Discount codes that are only for specific items will cause issues with this)</li>
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