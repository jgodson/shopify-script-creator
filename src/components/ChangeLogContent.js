import React from 'react';
import {Link, Stack} from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
       
      </ul> <li><Link url="https://github.com/jgodson/shopify-script-creator/pull/108" external>Added</Link> a new <b>Discounted Cart Subtotal (applied by discount code & scripts)</b> that accounts for the discount code when checking whether the cart is eligible for the script discount.</li>

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
