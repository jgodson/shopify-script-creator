import React from 'react';
import {Icon} from '@shopify/polaris';

export default function HelpIcon({url, external}) {
  const props = {
    target: external ? '_blank' : undefined,
    rel: external ? 'noopener noreferrer' : undefined,
  };

  const styles = {
    display: 'inline-block',
    verticalAlign: 'bottom',
    padding: '0 0.3em',
  };

  return <a style={styles} href={url} {...props}><Icon color="blue" source="help" /></a>
}
