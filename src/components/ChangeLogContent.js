import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>

      <li>The Bundle Campaign no longer allows a discounted item to qualify in bundles. This was done to prevent a single item from qualifying for multiple bundle campaigns it was a part of. If this causes any issues for you, please let me know via the <i>Leave feedback</i> link.</li>

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
