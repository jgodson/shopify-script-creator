import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
    <h3>Change Log</h3>

    <ul>
      <li><strong>IMPORTANT</strong> Reverted the wording of "Conditionally Allow Discount Codes" to "Conditionally Reject Discount Codes". Changed the functionality to work as it was originally intended instead (reject code if conditions match). If you import your previous campaigns that used this, you may need to make some adjustments to accommodate. Setting up this campaign as reject instead of allow seems to be easier to set up in most cases.</li>
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