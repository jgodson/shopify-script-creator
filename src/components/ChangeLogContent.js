import React from 'react';
import {Link, Stack} from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
        <li><a target="_blank" rel="noreferrer noopener" href="https://github.com/jgodson/shopify-script-creator/pull/91">Fix</a> for an unexpected case when the variant sku was nil</li>
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
