import React, { Component } from 'react';
import { Icon } from '@shopify/polaris';

import styles from './EditableTag.css';

export default function EditableTag({children, onRemove, onEdit} = props) {
  return (
    <span className="Polaris-Tag">
      <span>{children}</span>
      <span className="buttons__compact">
        <button
          aria-label="Edit"
          className="Polaris-Tag__Button"
          onClick={onEdit}
        >
          <Icon source="embed" />
        </button>
        <button
          aria-label="Remove"
          className="Polaris-Tag__Button"
          onClick={onRemove}
        >
          <Icon source="cancelSmall" />
        </button>
      </span>
    </span>
  );
}