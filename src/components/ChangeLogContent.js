import React from 'react';
import {Link, Stack} from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
       <li>Changed the date of the Shopify Scripts deprecation in the warning banner to the new date of June 30, 2026</li>
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
