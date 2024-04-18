import React from 'react';
import {Link, Stack} from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
        <li>Fixed an <Link url="https://github.com/jgodson/shopify-script-creator/issues/96" external>issue</Link> where using multiple <b>Discounted Cart Subtotal (applied by scripts)</b> didn't work.</li>
      </ul>

      <div style={{paddingTop: '2rem'}}>
        <Stack distribution="trailing">
          <Link url="https://github.com/jgodson/shopify-script-creator/releases" external>
            View previous releases
          </Link>
        </Stack>
      </div>
    </div>
  );
}
