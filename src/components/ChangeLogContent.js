import React from 'react';
import {Link, Stack} from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
        <li>Removed <strong>Leave feedback</strong> link. The feedback form has not accepted responses for some time now.</li>
        <li>Adjusted the script character limit indicator to the new maximum. </li>
        <li>Added a new <strong>Grouped Tiered Discount</strong> Campaign. This can be used to group applicable items and discount them based on the quantity purchased.</li>
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
