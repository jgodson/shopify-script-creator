import Common from './common';

const classes = {
  AllSelector: `
  class AllSelector
    def match?(gateway)
      return true
    end
  end`,

  GatewayNameSelector: `
class GatewayNameSelector
  def initialize(match_type, match_condition, names)
    @match_condition = match_condition == :undefined ? :match : match_condition
    @invert = match_type == :does_not
    @names = names.map(&:downcase)
  end

  def match?(gateway)
    name = gateway.name.downcase
    case @match_condition
      when :match
        return @invert ^ @names.include?(name)
      when :contains
        return @invert ^ @names.any? do |partial_name|
          name.include?(partial_name)
        end
      when :starts_with
        return @invert ^ @names.any? do |partial_name|
          name.start_with?(partial_name)
        end
      when :ends_with
        return @invert ^ @names.any? do |partial_name|
          name.end_with?(partial_name)
        end
    end
  end
end`,

  ConditionallyRemoveGateway: `
class ConditionallyRemoveGateway
  def initialize(customer_qualifier, cart_qualifier, line_item_qualifier, gateway_selector)
    @customer_qualifier = customer_qualifier
    @cart_qualifier = cart_qualifier
    @line_item_qualifier = line_item_qualifier
    @gateway_selector = gateway_selector
  end

  def run(gateways, cart)
    return unless @customer_qualifier.nil? || @customer_qualifier.match?(cart)
    return unless @cart_qualifier.nil? || @cart_qualifier.match?(cart)
    return unless @line_item_qualifier.nil? || cart.line_items.any? do |item|
      @line_item_qualifier.match?(item)
    end
    gateways.delete_if do |gateway|
      @gateway_selector.match?(gateway)
    end
  end
end`
};

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

const GATEWAY_SELECTORS = [
  {
    value: "none",
    label: "None",
    description: "No effects"
  },
  {
    value: "AllSelector",
    label: "All",
    description: "Selects all gateways"
  },
  {
    value: "GatewayNameSelector",
    label: "Gateway Name",
    description: "Matches gateways based on the name",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the following condition matches",
        options: [
          {
            value: "does",
            label: "Does"
          },
          {
            value: "does_not",
            label: "Does not"
          }
        ]
      },
      match_condition: {
        type: "select",
        description: "Set how the names are matched",
        options: [
          {
            value: "match",
            label: "Match one of"
          },
          {
            value: "contains",
            label: "Contain one of"
          },
          {
            value: "starts_with",
            label: "Start with one of"
          },
          {
            value: "ends_with",
            label: "End with one of"
          }
        ]
      },
      gateway_names: {
        type: "array",
        description: "Seperate individual names with a comma (,)"
      }
    }
  }
]

const CUSTOMER_AND_SELECTOR = {
  value: "AndSelector",
  label: "Multi-Select - Meets all conditions",
  description: "Qualifies if all of the following conditions are met",
  inputs: {
    customer_qualifier_1: [...CUSTOMER_QUALIFIERS],
    and_customer_qualifier_2: [...CUSTOMER_QUALIFIERS],
    and_customer_qualifier_3: [...CUSTOMER_QUALIFIERS],
  }
};

const CUSTOMER_OR_SELECTOR = {
  value: "OrSelector",
  label: "Multi-Select - Meets any conditions",
  description: "Qualifies if any of the following conditions are met",
  inputs: {
    customer_qualifier_1: [...CUSTOMER_QUALIFIERS],
    or_customer_qualifier_2: [...CUSTOMER_QUALIFIERS],
    or_customer_qualifier_3: [...CUSTOMER_QUALIFIERS]
  }
};

const LINE_ITEM_AND_SELECTOR = {
  value: "AndSelector",
  label: "Multi-Select - Meets all conditions",
  description: "Qualifies if all of the following conditions are met",
  inputs: {
    line_item_qualifier_1: [...LINE_ITEM_QUALIFIERS],
    and_line_item_qualifier_2: [...LINE_ITEM_QUALIFIERS],
    and_line_item_qualifier_3: [...LINE_ITEM_QUALIFIERS],
  }
};

const LINE_ITEM_OR_SELECTOR = {
  value: "OrSelector",
  label: "Multi-Select - Meets any conditions",
  description: "Qualifies if any of the following conditions are met",
  inputs: {
    line_item_qualifier_1: [...LINE_ITEM_QUALIFIERS],
    or_line_item_qualifier_2: [...LINE_ITEM_QUALIFIERS],
    or_line_item_qualifier_3: [...LINE_ITEM_QUALIFIERS]
  }
};

const CART_OR_SELECTOR = {
  value: "OrSelector",
  label: "Multi-Select - Meets any conditions",
  description: "Qualifies if any of the following conditions are met",
  inputs: {
    cart_qualifier_1: [...CART_QUALIFIERS],
    or_cart_qualifier_2: [...CART_QUALIFIERS],
    or_cart_qualifier_3: [...CART_QUALIFIERS]
  }
};

const CART_AND_SELECTOR = {
  value: "AndSelector",
  label: "Multi-Select - Meets all conditions",
  description: "Qualifies if all of the following conditions are met",
  inputs: {
    cart_qualifier_1: [...CART_QUALIFIERS],
    and_cart_qualifier_2: [...CART_QUALIFIERS],
    and_cart_qualifier_3: [...CART_QUALIFIERS]
  }
};

const campaigns = [
  {
    value: "ConditionallyRemoveGateway",
    label: "Conditionally Remove Gateways",
    description: "Removes any gateways that the conditions match",
    inputs: {
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      gateway_to_remove_selector: [...GATEWAY_SELECTORS]
    }
  }
];

export default {
  classes,
  defaultCode,
  campaigns
};