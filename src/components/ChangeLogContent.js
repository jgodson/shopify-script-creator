import React from 'react';
import {Link, Stack} from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
        <li>0.22.1 - Updated the max script length to the new supported length (24,576 characters)</li>
        <li>0.22.2 - Changed <b>Tax Discount</b> to properly account for items that were discounted in a previous campaign instead of causing a script error</li>
        <li>0.22.3 - Fixed an issue in the <b>Full Address Qualifier</b> the was causing some script errors</li>
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
