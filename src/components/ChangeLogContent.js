import React from 'react';
import { Link, Stack } from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
        <li>20.0 - Removed some fallbacks that were in place for default arguments that are no longer used. If you have issues with an existing saved script, try re-selecting your current options in all selects and then generate the script again.</li><br/>
        <li>20.0 - Added the ability to Activate and Deactivate campagins. Deactivated campaigns will not be included in generated code.</li><br/>
        <li>21.0 - (BETA FEATURE) Added the ability to minify scripts. This can help with scripts that end up going over the character limit and will fit them within that limit. If you encouter a script where minification causes issues, please let me know via the <b>Leave feedback</b> link.</li><br/>
        <li>21.0 - Added a visible character count and the maximum characters allowed within a script.</li>
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
