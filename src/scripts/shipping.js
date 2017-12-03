import Common from './common';

const classes = {
  RateNameSelector: `
  class RateNameSelector
  def initialize(match_type, match_condition, names)
    @match_condition = match_condition == :undefined ? :match : match_condition
    @invert = match_type == :does_not
    @names = names.map(&:downcase)
  end

  def match?(shipping_rate)
    name = shipping_rate.name.downcase
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

  RateSelector: `
class RateSelector
  def initialize(rate_names)
    @rate_names = rate_names.map { |name| name.downcase! }
  end
  
  def match?(rate)
    @rate_names.include?(rate.name.downcase)
  end
end`,

  PercentageDiscount: `
class PercentageDiscount
  def initialize(percent, message)
    @percent = Decimal.new(percent) / 100
    @message = message
  end
  
  def apply(rate)
    rate.apply_discount(rate.price * @percent, { message: @message })
  end 
end`,

  FixedDiscount: `
class FixedDiscount
  def initialize(amount, message)
    @amount = Money.new(cents: amount * 100)
    @message = message
  end
  
  def apply(rate)
    discount_amount = rate.price - @amount < 0 ? rate.price : @amount
    rate.apply_discount(discount_amount, { message: @message })
  end
end`,

// TODO: Not sure if this is feasable or not (Array of objects). Logix may be too complex
  AddressQualifier: `
# ----- Qualifying Addresses ----- #
# Example: {
#   address1: ["150 Elgin St", "150 Elgin Street"],
#   address2: "8th floor",
#   phone: 123-456-7890,
#   city: "Ottawa",
#   province: "Ontario",
#   country_code: "CA",
#   zip: "K2P 1L4",
#   match_type: :exact
# }
# Matches a given address to an array of addresses given
# Addresses should be in a hash format and will be the match type specified in the hash (:exact or :partial)
# If no match type is specified, :partial will be the default
# Only the given paramaters will be compared. Arrays can be used to match different options
class AddressQualifier
  def initialize(addresses)
    @addresses = addresses
  end
  
  def match?(cart)
    return false if cart.shipping_address.nil?
    
    @addresses.any? do |accepted_address|
      match_type = accepted_address[:match_type] ? accepted_address[:match_type] : :partial

      cart.shipping_address.to_hash.all? do |key, value|
        next true if value.empty?
        match = true
        key = key.to_sym
        value.downcase!
        
        unless accepted_address[key].nil?
          if accepted_address[key].kind_of?(Array)
            match = accepted_address[key].any? do |potential_address|
              potential_address.downcase!
              case match_type
                when :partial
                  value.include?(potential_address)
                when :exact
                  potential_address == value
              end
            end
          else
            accepted_address[key].downcase!
            case match_type
              when :partial
                match = value.include?(accepted_address[key])
              when :exact
                match = accepted_address[key] == value
            end
          end
        end
        match
      end
    end
  end
end`,

  ShippingDiscount: `
class ShippingDiscount
  def initialize(customer_qualifier, cart_qualifier, line_item_qualifier, rate_selector, discount)
    @customer_qualifier = customer_qualifier
    @cart_qualifier = cart_qualifier
    @rate_selector = rate_selector
    @discount = discount
  end
  
  def run(rates, cart)
    return unless @discount
    return unless @customer_qualifier.nil? || @customer_qualifier.match?(cart)
    return unless @cart_qualifier.nil? || @cart_qualifier.match?(cart)
    return unless @line_item_qualifier.nil? || cart.line_items.any? { |item| @line_item_qualifier.match?(item) }
    rates.each do |rate|
      next unless @rate_selector.nil? || @rate_selector.match?(rate)
      @discount.apply(rate)
    end
  end
end`,

  HideRateUnlessConditionsMet: `
class HideRateUnlessConditionsMet
  def initialize(customer_qualifier, cart_qualifier, line_item_qualifier, rate_selector)
    @customer_qualifier = customer_qualifier
    @cart_qualifier = cart_qualifier
    @line_item_qualifier = line_item_qualifier
    @rate_selector = rate_selector
  end

  def run(rates, cart)
    met = @customer_qualifier.nil? || @customer_qualifier.match?(cart)
    met = met ? @cart_qualifier.nil? || @cart_qualifier.match?(cart) : false
    met = met ? @line_item_qualifier.nil? || cart.line_items.any? { |item| @line_item_qualifier.match?(item) } : false
    unless met
      rates.delete_if do |rate|
        @rate_selector.match?(rate)
      end
    end
  end
end`
};

const defaultCode = `
CAMPAIGNS = [
|
].freeze

CAMPAIGNS.each do |campaign|
  campaign.run(Input.shipping_rates, Input.cart)
end

Output.shipping_rates = Input.shipping_rates`;

const CUSTOMER_QUALIFIERS = [
  ...Common.customer_qualifiers
];

const CART_QUALIFIERS = [
  ...Common.cart_qualifiers
];

const LINE_ITEM_QUALIFIERS = [
  ...Common.line_item_qualifiers
];

const RATE_SELECTORS = [
  {
    value: "RateNameSelector",
    label: "Rate Name",
    description: "Matches shipping rates based on the name",
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
      rate_names: {
        type: "array",
        description: "Seperate individual names with a comma (,)"
      }
    }
  }
];

const DISCOUNTS = [
  {
    value: "none",
    label: "None",
    description: "No discount"
  },
  {
    value: "PercentageDiscount",
    label: "Percentage Discount",
    description: "Discounts matched rates by a percentage",
    inputs: {
      percent: {
        type: "number",
        description: "Percent discount to apply to each rate"
      },
      message: {
        type: "text",
        description: "Message to display to customer"
      }
    }
  },
  {
    value: "FixedDiscount",
    label: "Fixed Discount",
    description: "Discounts matched rates by a fixed amount",
    inputs: {
      amount: {
        type: "number",
        description: "Discount to apply to each rate"
      },
      message: {
        type: "text",
        description: "Message to display to customer"
      }
    }
  }
];

const CUSTOMER_AND_SELECTOR = {
  value: "AndSelector",
  label: "Multi-Select - Meets all conditions",
  description: "Qualifies if all of the following conditions are met",
  inputs: {
    line_item_qualifier_1: [...CUSTOMER_QUALIFIERS],
    and_line_item_qualifier_2: [...CUSTOMER_QUALIFIERS],
    and_line_item_qualifier_3: [...CUSTOMER_QUALIFIERS],
  }
};

const CUSTOMER_OR_SELECTOR = {
  value: "OrSelector",
  label: "Multi-Select - Meets any conditions",
  description: "Qualifies if any of the following conditions are met",
  inputs: {
    line_item_qualifier_1: [...CUSTOMER_QUALIFIERS],
    or_line_item_qualifier_2: [...CUSTOMER_QUALIFIERS],
    or_line_item_qualifier_3: [...CUSTOMER_QUALIFIERS]
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

const RATE_AND_SELECTOR = {
  value: "AndSelector",
  label: "Multi-Select - Meets all conditions",
  description: "Selected if all of the following conditions are met",
  inputs: {
    line_item_qualifier_1: [...RATE_SELECTORS],
    and_line_item_qualifier_2: [...RATE_SELECTORS],
    and_line_item_qualifier_3: [...RATE_SELECTORS],
  }
};

const RATE_OR_SELECTOR = {
  value: "OrSelector",
  label: "Multi-Select - Meets any conditions",
  description: "Selected if any of the following conditions are met",
  inputs: {
    line_item_qualifier_1: [...RATE_SELECTORS],
    or_line_item_qualifier_2: [...RATE_SELECTORS],
    or_line_item_qualifier_3: [...RATE_SELECTORS]
  }
};

const campaigns = [
  {
    value: "ShippingDiscount",
    label: "Shipping Discount",
    description: "Specify conditions to apply a shipping discount",
    inputs: {
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      rate_to_discount_selector: [...RATE_SELECTORS],
      discount_to_apply: [...DISCOUNTS]
    }
  },
  {
    value: "HideRateUnlessConditionsMet",
    label: "Hide Rate If Not Qualified",
    description: "Shipping rate will be hidden unless conditions are met",
    inputs: {
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      rate_to_hide_selector: [...RATE_SELECTORS]
    }
  }
];

export default {
  classes,
  defaultCode,
  campaigns
};