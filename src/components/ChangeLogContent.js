import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3>Change Log</h3>

      <ul>
      <li>Fixed Total Weight Qualifier</li>

      <li>Reworded Cart Amount Qualifier a bit to clarify that it's the subtotal amount</li>

      <li>Added a Cart Quantity Qualifier to check for a specific number of items in the cart (total items or total qualified items)</li>
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