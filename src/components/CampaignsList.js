import React, { Component } from 'react';
import { Card, Stack, Button, TextStyle, Subheading, TextContainer, Badge } from '@shopify/polaris';
import {EditMajorMonotone, DeleteMajorMonotone, DuplicateMinor, AddNoteMajorMonotone} from '@shopify/polaris-icons';
import { splitCamelCase } from '../helpers';

import styles from './CampaignsList.css';

export default class CampaignsList extends Component {
  constructor(props) {
    super(props);

    this.renderCardSection = this.renderCardSection.bind(this);
    this.createNew = this.createNew.bind(this);
    this.toggleActive = this.toggleActive.bind(this);
  }

  createNew() {
    if (this.props.isEditing) {
      alert("Save or discard changes to the current campaign first.");
      return;
    }
    this.props.showForm(true)
  }

  toggleActive(id) {
    return () => this.props.toggleActive(id);
  }

  renderCardSection(campaign) {
    let button = null;
    let messages = campaign.inputs && campaign.inputs.filter((input) => input.name && input.name.search(/discount(?!codes)/i) > -1);
    messages = messages && messages.map((campaign) => {
      if (!campaign.inputs) { return ["", ""] }
      const stringIndex = campaign.inputs.findIndex((input) => typeof input === 'string' && input.indexOf('"') > -1);
      const messageType = campaign.name.search(/(reject|exclude)/i) > -1 ? 'Rejection message' : 'Discount message';
      return [messageType, campaign.inputs[stringIndex].replace(/"/g, '').trim()];
    });
    if (campaign.id) {
      button = <Button size="slim" icon={EditMajorMonotone} onClick={() => this.props.editCampaign(campaign.id)}>Edit</Button>;
    } else {
      button = <Button size="slim" icon={AddNoteMajorMonotone} primary onClick={this.createNew}>Create new</Button>;
    }
    const campaignTitle = campaign.label || splitCamelCase(campaign.name)
    const badgeMarkup = campaign.id && (
      <button className="active-toggle" onClick={this.toggleActive(campaign.id)}>
        {campaign.active === false ?
          <Badge>Inactive</Badge> : <Badge status="success">Active</Badge>
        }
      </button>
    );
    return (
      <Card.Section key={`campaign-${campaign.id || ''}`}>
        <Subheading>{campaignTitle}</Subheading>
        <TextContainer spacing="tight">
          <Stack distribution="equalSpacing" alignment="center">
            {badgeMarkup}
            {campaign.id && (
              <Button
                plain
                icon={DuplicateMinor}
                onClick={() => this.props.duplicateCampaign(campaign.id)}
              >
                Duplicate
            </Button>
            )}
          </Stack>
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
            {campaign.id && <Button size="slim" destructive icon={DeleteMajorMonotone} onClick={() => this.props.removeCampaign(campaign.id)}>Remove</Button>}
            {button}
          </Stack>
        </TextContainer>
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
