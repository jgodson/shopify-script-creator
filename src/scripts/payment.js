import Common from './common';

const classes = `\
############### PAYMENT SCRIPT CLASSES ###############
`;

const defaultCode = `
CAMPAIGNS = [
|
].freeze

CAMPAIGNS.each do |campaign|
  campaign.run(Input.payment_gateways, Input.cart)
end

Output.payment_gateways = Input.payment_gateways`;

const CUSTOMER_QUALIFIERS = [
  ...Common.customer_qualifiers
];

const CART_QUALIFIERS = [
  ...Common.cart_qualifiers
];

const LINE_ITEM_QUALIFIERS = [
  ...Common.line_item_qualifiers
];

const CUSTOMER_AND_SELECTOR = {
  value: "AndSelector",
  label: "And Selector",
  description: "Qualifies if all of the requirements are met",
  inputs: {
    line_item_qualifier_1: [...CUSTOMER_QUALIFIERS],
    line_item_qualifier_2: [...CUSTOMER_QUALIFIERS],
    line_item_qualifier_3: [...CUSTOMER_QUALIFIERS],
  }
};

const CUSTOMER_OR_SELECTOR = {
  value: "OrSelector",
  label: "Or Selector",
  description: "Qualifies if any of the requirements are met",
  inputs: {
    line_item_qualifier_1: [...CUSTOMER_QUALIFIERS],
    line_item_qualifier_2: [...CUSTOMER_QUALIFIERS],
    line_item_qualifier_3: [...CUSTOMER_QUALIFIERS]
  }
};

const LINE_ITEM_AND_SELECTOR = {
  value: "AndSelector",
  label: "And Selector",
  description: "Qualifies if all of the requirements are met",
  inputs: {
    line_item_qualifier_1: [...LINE_ITEM_QUALIFIERS],
    line_item_qualifier_2: [...LINE_ITEM_QUALIFIERS],
    line_item_qualifier_3: [...LINE_ITEM_QUALIFIERS],
  }
};

const LINE_ITEM_OR_SELECTOR = {
  value: "OrSelector",
  label: "Or Selector",
  description: "Qualifies if any of the requirements are met",
  inputs: {
    line_item_qualifier_1: [...LINE_ITEM_QUALIFIERS],
    line_item_qualifier_2: [...LINE_ITEM_QUALIFIERS],
    line_item_qualifier_3: [...LINE_ITEM_QUALIFIERS]
  }
};

const CART_OR_SELECTOR = {
  value: "OrSelector",
  label: "Or Selector",
  description: "Qualifies if any of the requirements are met",
  inputs: {
    cart_qualifier_1: [...CART_QUALIFIERS],
    cart_qualifier_2: [...CART_QUALIFIERS],
    cart_qualifier_3: [...CART_QUALIFIERS]
  }
};

const CART_AND_SELECTOR = {
  value: "AndSelector",
  label: "And Selector",
  description: "Qualifies if all of the requirements are met",
  inputs: {
    cart_qualifier_1: [...CART_QUALIFIERS],
    cart_qualifier_2: [...CART_QUALIFIERS],
    cart_qualifier_3: [...CART_QUALIFIERS]
  }
};

const campaigns = [

]

export default {
  classes,
  defaultCode,
  campaigns
};