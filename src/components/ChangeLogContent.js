import React from 'react';
import {Link, Stack} from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
        <li>A proper <a target="_blank" rel="noreferrer noopener" href="https://github.com/jgodson/shopify-script-creator/pull/92">fix</a> for an unexpected case when the variant sku was nil. The previous fix in v0.34.1 caused a different error.</li>
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
