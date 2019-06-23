import React, {Component} from 'react';
import {Card, Stack, Button, TextStyle, Subheading, TextContainer, Badge, Heading} from '@shopify/polaris';
import {EditMajorMonotone, DeleteMajorMonotone, DuplicateMinor, AddNoteMajorMonotone} from '@shopify/polaris-icons';
import {DragDropContext, Droppable, Draggable} from 'react-beautiful-dnd';
import {splitCamelCase} from '../helpers';

import styles from './CampaignsList.css';

export default class CampaignsList extends Component {
  constructor(props) {
    super(props);

    this.renderCardSection = this.renderCardSection.bind(this);
    this.createNew = this.createNew.bind(this);
    this.toggleActive = this.toggleActive.bind(this);
    this.onDrop = this.onDrop.bind(this);
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

  onDrop(result) {
    if (!result.source || !result.destination) {
      return;
    }

    const from = result.source.index;
    const to = result.destination.index;
    this.props.handleSort(from, to);
  }

  renderCardSection(campaign, index) {
    let messages = campaign.inputs && campaign.inputs.filter((input) => input.name && input.name.search(/discount(?!codes)/i) > -1);
    messages = messages && messages.map((campaign) => {
      if (!campaign.inputs) { return ["", ""] }
      const stringIndex = campaign.inputs.findIndex((input) => typeof input === 'string' && input.indexOf('"') > -1);
      const messageType = campaign.name.search(/(reject|exclude)/i) > -1 ? 'Rejection message' : 'Discount message';
      return [messageType, campaign.inputs[stringIndex].replace(/"/g, '').trim()];
    });

    const campaignTitle = campaign.label || splitCamelCase(campaign.name)
    const badgeMarkup = (
      <button className="active-toggle" onClick={this.toggleActive(campaign.id)}>
        {campaign.active === false ?
          <Badge>Inactive</Badge> : <Badge status="success">Active</Badge>
        }
      </button>
    );

    return (
      <Draggable key={`campaign-${campaign.id}`} draggableId={`CampaignList-${campaign.id}`} index={index}>
        {(provided) => (
          <div
            className="draggable"
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
          >
            <Card.Section>
              <Subheading>{campaignTitle}</Subheading>
              <TextContainer spacing="tight">
                <Stack distribution="equalSpacing" alignment="center">
                  {badgeMarkup}
                  <Button
                    plain
                    icon={DuplicateMinor}
                    onClick={() => this.props.duplicateCampaign(campaign.id)}
                  >
                    Duplicate
                  </Button>
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
                  <Button
                    size="slim"
                    destructive
                    icon={DeleteMajorMonotone}
                    onClick={() => this.props.removeCampaign(campaign.id)}
                  >
                    Remove
                  </Button>
                  <Button
                    size="slim"
                    icon={EditMajorMonotone}
                    onClick={() => this.props.editCampaign(campaign.id)}
                  >
                    Edit
                  </Button>
                </Stack>
              </TextContainer>
            </Card.Section>
          </div>
        )}
      </Draggable>
    )
  }

  render() {
    return (
      <Card>
        <Card.Section>
          <Stack distribution="equalSpacing">
            <Heading>Campaigns</Heading>
            <Button size="slim" icon={AddNoteMajorMonotone} primary onClick={this.createNew}>Create new</Button>
          </Stack>
          </Card.Section>
        <DragDropContext
          onDragEnd={this.onDrop}
        >
          <Droppable droppableId="CampaignList">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {this.props.campaigns.map((campaign, index) => this.renderCardSection(campaign, index))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Card>
    )
  }
}
