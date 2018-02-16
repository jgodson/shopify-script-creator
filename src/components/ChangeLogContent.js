import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3>Change Log</h3>

      <ul>
      <li>Added "Discountable Items Total Quantity" and "Cart Items Total Quantity" to the tier options of the "Tiered Discount Campaign".</li>

      <li>Renamed "Discountable Items Total"  to "Discountable Items Subtotal"</li>

      <li>Fixed a bug in the "Tiered Discount Campaign" where tiered discounts would only apply the first qualified tier and ignore the later ones (only an issue when customer qualifies for multiple tiers). If you have generated a script previously that customers might qualify for multiple tiers, either import or recreate the script and generate again to fix this.</li>
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