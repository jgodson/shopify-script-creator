import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>

      <li>19.0 - Fixed a bug in the <b>Customer Email Qualifier</b> that caused issues when the customer did not have an email associated with their account</li>
      <li>19.0 - Added an <b>Item Price Qualifier</b> to the list of <b>Line Item Qualifiers</b>. This allows you to check that the prices of invididual items in the cart are more than or less than a specific amount</li>
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
