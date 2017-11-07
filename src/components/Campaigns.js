import React, { Component } from 'react';
import { Layout, ResourceList, Card, Subheading, Stack, Button } from '@shopify/polaris';
import { splitCamelCase } from '../helpers';

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
    if (campaign.id) {
      button = <Button size="slim" onClick={() => this.props.editCampaign(campaign.id)}>Edit</Button>;
    } else {
      button = <Button size="slim" primary onClick={this.createNew}>Create new</Button>;
    }
    return (
      <Card.Section title={splitCamelCase(campaign.name)} key={`campaign${'-' + (campaign.id || '')}`}>
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