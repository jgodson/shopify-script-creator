import React from 'react';
import { Layout, FooterHelp, Link } from '@shopify/polaris';

export default function Footer() {
  return (
    <Layout.Section>
      <FooterHelp>
        Learn more about
        <Link external url="https://help.shopify.com/api/tutorials/shopify-scripts">
          <span> Shopify scripts</span>
        </Link>
        .
      </FooterHelp>
    </Layout.Section>
  )
}
