import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
      <li>Added a new Cart Qualifier called "Shipping Address - Full Address Qualifier", which lets you target more specific addresses. There's quite a bit of flexibility built into this one, so take a look! (Note when using zip codes, for example, K2W1LP and K2W 1LP are both accepted as Canadian zip codes and you need to account for both (unless you use just the first portion with a partial match)</li>

      <li>Fixed a bug in the "Discount Code List" campaign that would not allow a decimal value.</li>

      <li>Fixed a bug where Bundle Discount would not work properly with the Post Cart Amount Qualifier</li>

      <li>Fixed a bug where a script error would occur when using the Bundle Discount in combination with a Cart Amount or Cart Quantity qualifier</li>

      <li>Variant SKU's are now an option to use for bundles in the Bundle Discount campaign</li>

      <li>Fixed a bug in the Fixed Rate Shipping Discount that would cause a script error</li>

      <li>Added a button so that you can easily duplicate a campaign in the list</li>

      <li>Some other minor bug fixes</li>
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
