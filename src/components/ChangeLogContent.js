import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>

      <li>The <b>Fixed Total Discount</b> discount now allows you to split the discount between all discountable items. This is the behaviour by default when using the <b>Fixed total discount</b> option for <b>Tiered Discount</b>, <b>Discount Code List</b> and the <b>Fixed pattern</b> for <b>Discount Code Pattern</b> campaigns. Let me know via the feedback link if you encounter any issues.</li>

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
