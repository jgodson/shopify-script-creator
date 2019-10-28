import React from 'react';
import {Link, Stack} from '@shopify/polaris';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h3 id="changelog">Change Log</h3>

      <ul>
        <li>Added a new campaign for line item scripts called <b>Reset Script Discounts</b>. This allows you to reset all script discounts applied so far based on the conditions given.</li>
        <li>Removed “Discounted Cart Subtotal (applied by scripts)” <b>Cart Qualifier</b>. If you were using this, you will need to either change or remove this from your script before you are able to generate it again.</li>
        <li>Renamed “Cart/Item subtotal” <b>Cart Qualifier</b> to “Cart/Item/Discount subtotal” and re-worded options to be more clear.</li>
        <li>Removed some custom error messages (that will just cause an error elsewhere anyway) in the script code to reduce character count.</li>
        <li>Added the concept of "variables" in the script. Some campaigns, including the dedicated <b>Set Variables</b> will allow you to set these and you are able to check them as <b>Cart Qualifiers</b> with the <b>Check Variables</b> Qualifier.</li>
      </ul>
      This allows a much easier way to reset the discounts that were applied and instead apply a different discount altogether. <a target="_blank" rel="noreferrer" href="https://drive.google.com/file/d/1i7SN7X52m5vQ4Ngjz1WEY2qygA80jdll/view?usp=drivesdk">See an example video</a>
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
