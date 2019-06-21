import React from 'react';
import {Icon} from '@shopify/polaris';

export default function HelpIcon({url, external}) {
  const props = {
    target: external ? '_blank' : undefined,
    rel: external ? 'noopener noreferrer' : undefined,
  };

  return <a href={url} {...props}><Icon color="blue" source="help" /></a>
}
