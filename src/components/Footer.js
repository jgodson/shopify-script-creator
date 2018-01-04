import React from 'react';
import { Layout, FooterHelp, Link } from '@shopify/polaris';

export default function Footer() {
  return (
    <Layout.Section>
      <FooterHelp>Learn more about <Link url="https://help.shopify.com/api/tutorials/shopify-scripts">Shopify scripts</Link>.</FooterHelp>
    </Layout.Section>
  )
}