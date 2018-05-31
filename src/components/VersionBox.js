import React from 'react';
import styles from './VersionBox.css';

export default function VersionBox(props) {
  return (
    <div className="version-box">
      <a 
        href="https://github.com/jgodson/shopify-script-creator/releases"
        target="_blank"
        rel="noopener noreferrer"
      >
        BETA {props.currentVersion}
      </a>
    </div>
  )
}