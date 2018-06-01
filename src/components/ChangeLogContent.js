import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3>Change Log</h3>

      <ul>
      <li>
        <strong>NEW - Bundle Discount campaign</strong><br />
        <span>Use the </span>
        <a 
          href="https://docs.google.com/forms/d/e/1FAIpQLSdBHeVvdU92fc8vsqRuvx5uWuYQFsW8U3Co5HDIusH8YEH_VA/viewform"
          target="_blank"
          rel="noopener noreferrer"
        >
        Leave feedback
        </a>
        <span> link if you notice any issues</span>
      </li>
      <li>When adding discounts to the Discount Code List campaign, you no longer have to type the discount type. There is an option selector there now</li>
      <li>Negative numbers are no longer permitted in number inputs</li>
      <li><span>Fixed a </span>
        <a
          href="https://github.com/jgodson/shopify-script-creator/issues/1" 
          target="_blank"
          rel="noopener noreferrer"
        >
          bug in the CartQuantityQualifier
        </a>
      </li>
      <li>Other minor fixes and improvements</li>
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