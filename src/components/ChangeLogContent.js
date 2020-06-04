import React from 'react';
import {Link, Stack} from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
        <li>Fixed a bug when using a combination of the "Bundle Discount" campaign, "Cart Has Items" Cart Qualifier and "Has Properties" Item Selector</li>
        <li>Renamed “Cart/Item subtotal” <b>Cart Qualifier</b> to “Cart/Item/Discount subtotal” and re-worded options to be more clear.</li>
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
