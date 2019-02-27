import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>

      <li>Renamed the Cart Qualifier called <b>Cart/Item quantity</b> to <b>Cart/Item/Line quantity</b></li>
      <li>Added line quantity options to the renamed <b>Cart/Item/Line quantity</b> Cart Qualifier. There are options for each line, or all lines, to match the quantity condition.</li>
      <li>Fixed a small bug in the <b>Cart/Item/Line quantity</b> Cart Qualifier where if it was set to <i>Qualified item total quantity</i> and no <i>Discounted Item Selector</i> was given, it would consider the total quantity as 0. It now counts the quantity of all items in the cart when no <i>Discounted Item Selector</i> is given (works just the like the <i>Cart total quantity</i> option in this case).</li>

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
