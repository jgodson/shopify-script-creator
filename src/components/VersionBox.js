import React from 'react';
import styles from './VersionBox.css';

export default function VersionBox(props) {
  return (
    <div className="version-box">
      <a href="https://github.com/jgodson/shopify-script-creator/releases">
        BETA {props.currentVersion}
      </a>
    </div>
  )
}