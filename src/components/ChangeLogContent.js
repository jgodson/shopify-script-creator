import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
      <li>Fixed a <a href="https://github.com/jgodson/shopify-script-creator/issues/2" target="_blank" rel="noopener noreferrer">bug</a> in the Buy X Get X campaign where it would not split out items properly when less than full multiples were bought (eg: buy 10 get 10 would give you 11 free if you purchased 11, 12 free if you purchased 12, etc). If the fixing of this bug causes any issues for you, please let me know by submitting a bug on <a href="https://github.com/jgodson/shopify-script-creator/issues" target="_blank" rel="noopener noreferrer">GitHub</a> or using the <a href="https://docs.google.com/forms/d/e/1FAIpQLSdBHeVvdU92fc8vsqRuvx5uWuYQFsW8U3Co5HDIusH8YEH_VA/viewform" target="_blank" rel="noopener noreferrer">feedback form</a></li>

      <li>Reduced spacing between title and tags to better align them with the option selection</li>
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