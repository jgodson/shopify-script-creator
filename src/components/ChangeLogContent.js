import React from 'react';

export default function ChangeLogContent({newVersion} = props) {
  return (
    <div>
      <h2><strong>Change Log</strong></h2>

      <ul>
      <li><p><strong>IMPORTANT</strong> Buy X Get X now supports buy <strong>1</strong> get X. This means that the number that you had previously entered in buy x will probably need to be incremented by 1 to function the same as it had in previous releases.</p></li>

      <li><p>Fixed unable to add decimal number as a discount amount (note some generated scripts could ignore a decimal, or not work properly when one is present. Make sure to verify they work correctly before publishing and please leave feedback to let me know if something doesn't work)</p></li>

      <li><p>Added icon to Copy button for script output to make it more visible</p></li>

      <li><p>Adjusted spacing on some of the inputs</p></li>

      <li><p>Object inputs no longer are input in a single text area. The values are now shown in a table and editing/adding is done via a pop-up modal.</p></li>

      <li><p>Array inputs are also no longer input in a single text area. The values are shown as tags and are added in a pop-up modal. Removal is done with a click on the X button attached to the tag.</p></li>

      <li><p>Used the same modal to show the change log the first time a new version is released. This will ensure no one misses important information.</p></li>
      </ul>
    </div>
  );
}