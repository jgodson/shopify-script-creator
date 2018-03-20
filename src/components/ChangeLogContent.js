import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3>Change Log</h3>

      <ul>
      <li>Fixed ends with option causing errors in script for Customer Email qualifier, Customer Tag qualifier, Discount Code qualifier, Product Tag selector, and Variant SKU selector.</li>
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