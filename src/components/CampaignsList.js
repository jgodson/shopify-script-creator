import React, { Component } from 'react';
import { Card, Stack, Button, TextStyle } from '@shopify/polaris';
import { splitCamelCase } from '../helpers';

import styles from './CampaignsList.css';

export default class Campaigns extends Component {
  constructor(props) {
    super(props);

    this.renderCardSection = this.renderCardSection.bind(this);
    this.createNew = this.createNew.bind(this);
  }

  createNew() {
    if (this.props.isEditing) {
      alert("Save or discard changes to the current campaign first.");
      return;
    }
    this.props.showForm(true)
  }

  renderCardSection(campaign) {
    let button = null;
    let messages = campaign.inputs && campaign.inputs.filter((input) => input.name && input.name.search(/discount/i) > -1);
    messages = messages && messages.map((campaign) => {
      if (!campaign.inputs) { return ["", ""] }
      const lastValueIndex = campaign.inputs.length - 1;
      const messageType = campaign.name.search(/(reject|exclude)/i) > -1 ? 'Rejection message' : 'Discount message';
      return [messageType, campaign.inputs[lastValueIndex].replace(/"/g, '').trim()];
    });
    if (campaign.id) {
      button = <Button size="slim" onClick={() => this.props.editCampaign(campaign.id)}>Edit</Button>;
    } else {
      button = <Button size="slim" primary onClick={this.createNew}>Create new</Button>;
    }
    const campaignTitle = campaign.label || splitCamelCase(campaign.name)
    return (
      <Card.Section title={campaignTitle} key={`campaign-${campaign.id || ''}`}>
        {messages && 
          messages.map((message, index) => {
            if (message[1] === "") { return false; }
            return (
              <div key={`campaign-${campaign.id}-message-${index}`} className="campaign-info">
                <TextStyle>{`${message[0]}: `}</TextStyle>
                <TextStyle variation="subdued">{message[1]}</TextStyle>
              </div>
            );
          })
        }
        <Stack distribution="trailing">
          {campaign.id && <Button size="slim" destructive onClick={() => this.props.removeCampaign(campaign.id)}>Remove</Button>}
          {button}
        </Stack>
      </Card.Section>
    )
  }

  render() {
    return (
      <Card title="Campaigns">
        {this.props.campaigns.map((campaign) => this.renderCardSection(campaign))}
      </Card>
    )
  }
}