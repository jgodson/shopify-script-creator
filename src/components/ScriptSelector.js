import React, { Component } from 'react';
import { 
  ButtonGroup,
  Button,
  Card,
  Stack,
  Heading,
  TextStyle 
} from '@shopify/polaris';

export default class ScriptSelector extends Component {
  constructor(props) {
    super(props);

    this.descriptions = {
      line_item: "Line item scripts can be used for various item discounts (eg: BOGO (Buy one, get one), tiered discount, percent discount), limit item quantities, remove items from the cart, and reject discount codes.",
      shipping: "Shipping scripts can be used to reorder, rename, discount, and remove shipping rates.",
      payment: "Payment scripts can be used to reorder, rename, and remove payment methods."
    };
  }

  handleClick(newType) {
    this.props.changeType(newType);
  }

  render() {
    const currentType = this.props.currentType;
    const buttons = [
      {
        name: "Line Item",
        disabled: currentType == "line_item",
        onClick: () => this.handleClick("line_item"),
      },
      {
        name: "Shipping",
        disabled: currentType == "shipping",
        onClick: () => this.handleClick("shipping"),
      },
      {
        name: "Payment",
        disabled: currentType == "payment",
        onClick: () => this.handleClick("payment"),
      }
    ];
    const description = <TextStyle variation="subdued" >{this.descriptions[currentType]}</TextStyle>;

    return (
      <Card>
        <Card.Section>
          <Stack alignment="center">
            <Stack.Item fill>
              <Heading>Script type</Heading>
            </Stack.Item>
            <Stack.Item>
              <ButtonGroup segmented>
                {
                  buttons.map((button) => {
                    return <Button key={button.name} disabled={button.disabled} onClick={button.onClick}>{button.name}</Button>
                  })
                }
              </ButtonGroup>
            </Stack.Item>
            </Stack>
          </Card.Section>
          <Card.Section title="Details">
            {description}
          </Card.Section>
      </Card>
    )
  }

}