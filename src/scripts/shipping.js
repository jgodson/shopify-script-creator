import Common from './common';

const classes = {
  AllRatesSelector: `
class AllRatesSelector
  def match?(rate)
    return true
  end
end`,

  RateNameSelector: `
class RateNameSelector < Selector
  def initialize(match_type, match_condition, names)
    @match_condition = match_condition == :default ? :match : match_condition
    @invert = match_type == :does_not
    @names = names.map(&:downcase)
  end

  def match?(shipping_rate)
    name = shipping_rate.name.downcase
    case @match_condition
      when :match
        return @invert ^ @names.include?(name)
      else
        return @invert ^ partial_match(@match_condition, name, @names)
    end
  end
end`,

  RateCodeSelector: `
class RateCodeSelector < Selector
  def initialize(match_type, match_condition, codes)
    @match_condition = match_condition == :default ? :match : match_condition
    @invert = match_type == :does_not
    @codes = codes.map(&:downcase)
  end

  def match?(shipping_rate)
    code = shipping_rate.code.downcase
    case @match_condition
      when :match
        return @invert ^ @codes.include?(code)
      else
        return @invert ^ partial_match(@match_condition, code, @codes)
    end
  end
end`,

  RateSourceSelector: `
class RateSourceSelector < Selector
  def initialize(match_type, sources)
    @invert = match_type == :not_one
    @sources = sources.map(&:downcase)
  end

  def match?(shipping_rate)
    source = shipping_rate.source.downcase
    @invert ^ @sources.include?(source)
  end
end`,

  ReducedRateSelector: `
class ReducedRateSelector < Selector
  def initialize(match_type)
    @invert = match_type == :not
  end
  
  def match?(rate)
    return @invert if rate.instance_variable_get(:@adjustments).empty?
    return @invert ^ rate.instance_variable_get(:@adjustments).any? do |adjustment|
      next unless adjustment&.property == :price
      adjustment.old_value.cents > adjustment.new_value.cents
    end
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

// TODO: Not sure if this is feasable or not (object is too big - how would I format this?)
// [exactly : 150 Elgin St, 150 Elgin Street : 8th floor : 123-456-7890 : Ottawa : Ontario : CA : K2P 1L4]- but every input would be required?
// I think feasable if I set up a UI to enter instead of the text box and do nil if that one isn't filled in
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
  # TODO: ADD checks to make sure every field wanted exists
    return false if cart.shipping_address.nil?
    
    @addresses.any? do |accepted_address|
      match_type = accepted_address[:match_type] ? accepted_address[:match_type] : :partial

      cart.shipping_address.to_hash.all? do |key, value|
        next true if value.empty?
        match = true
        key = key.to_sym
        value.downcase!
        
        unless accepted_address[key].nil?
          if accepted_address[key].is_a?(Array)
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
class ShippingDiscount < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, rate_selector, discount)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = li_match_type == :default ? :any? : (li_match_type.to_s + '?').to_sym
    @rate_selector = rate_selector
    @discount = discount
  end
  
  def run(rates, cart)
    raise "Campaign requires a discount" unless @discount
    return unless qualifies?(cart)
    rates.each do |rate|
      next unless @rate_selector.nil? || @rate_selector.match?(rate)
      @discount.apply(rate)
    end
  end
end`,

  ConditionallyHideRates: `
class ConditionallyHideRates < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, rate_selector)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = li_match_type == :default ? :any? : (li_match_type.to_s + '?').to_sym
    @rate_selector = rate_selector
  end

  def run(rates, cart)
    rates.delete_if { |rate| @rate_selector.match?(rate) } if qualifies?(cart)
  end
end`,

  ChangeRateName: `
class ChangeRateName < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, rate_selector, new_name)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = li_match_type == :default ? :any? : (li_match_type.to_s + '?').to_sym
    @rate_selector = rate_selector
    @new_name = new_name
  end

  def run(rates, cart)
    return unless qualifies?(cart) && @rate_selector
    rates.each do|rate| 
      rate.change_name(@new_name, {message: ""}) if @rate_selector.match?(rate)
    end
  end
end`,

  ReorderShippingRates: `
class ReorderShippingRates < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, order_from, desired_order)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = li_match_type == :default ? :any? : (li_match_type.to_s + '?').to_sym
    @reverse = order_from == :last_to_first
    @desired_order = desired_order.map(&:downcase)
  end

  def run(rates, cart)
    return unless qualifies?(cart)
    new_rate_order = []
    leftover_rates = []
    rates.each { |rate| new_rate_order << rate.name if @desired_order.include?(rate.name.downcase) }
    return if new_rate_order.empty?
    new_rate_order = new_rate_order.sort_by { |name| @desired_order.index(name.downcase) }
    rates.each { |rate| leftover_rates << rate.name unless new_rate_order.include?(rate.name) }
    if @reverse
      new_rate_order.reverse!
      leftover_rates.reverse.each { |name| new_rate_order.unshift(name) }
    else
      leftover_rates.each { |name| new_rate_order << name }
    end
    rates.sort_by! { |rate| new_rate_order.index(rate.name) }
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
  ...Common.customerQualifiers
];

const CART_QUALIFIERS = [
  ...Common.cartQualifiers
];

const LINE_ITEM_QUALIFIERS = [
  ...Common.lineItemSelectors
];

const RATE_SELECTORS = [
  {
    value: "none",
    label: "None",
    description: "No rates are selected"
  },
  {
    value: "AllRatesSelector",
    label: "All",
    description: "All rates are selected"
  },
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
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
            label: "Start with one of"
          },
          {
            value: "end_with",
            label: "End with one of"
          }
        ]
      },
      rate_names: {
        type: "array",
        description: "Seperate individual names with a comma (,)"
      }
    }
  },
  {
    value: "RateCodeSelector",
    label: "Rate Code",
    description: "Matches shipping rates based on the code",
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
        description: "Set how the codes are matched",
        options: [
          {
            value: "match",
            label: "Match one of"
          },
          {
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
            label: "Start with one of"
          },
          {
            value: "end_with",
            label: "End with one of"
          }
        ]
      },
      rate_codes: {
        type: "array",
        description: "Seperate individual codes with a comma (,)"
      }
    }
  },
  {
    value: "RateSourceSelector",
    label: "Rate Source",
    description: "Matches shipping rates based on the source (eg: shopify)",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the sources are matched",
        options: [
          {
            value: "is_one",
            label: "Is one of"
          },
          {
            value: "not_one",
            label: "Is not one of"
          }
        ]
      },
      rate_sources: {
        type: "array",
        description: "Seperate individual sources with a comma (,)"
      }
    }
  },
  {
    value: "ReducedRateSelector",
    label: "Rate Discounted",
    description: "Matches shipping rates if they have/have not been discounted",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the rates are matched",
        options: [
          {
            value: "is",
            label: "Is discounted"
          },
          {
            value: "not",
            label: "Is not discounted"
          }
        ]
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
    rate_selector_1: [...RATE_SELECTORS],
    and_rate_selector_2: [...RATE_SELECTORS],
    and_rate_selector_3: [...RATE_SELECTORS],
  }
};

const RATE_OR_SELECTOR = {
  value: "OrSelector",
  label: "Multi-Select - Meets any conditions",
  description: "Selected if any of the following conditions are met",
  inputs: {
    rate_selector_1: [...RATE_SELECTORS],
    or_rate_selector_2: [...RATE_SELECTORS],
    or_rate_selector_3: [...RATE_SELECTORS]
  }
};

const campaigns = [
  {
    value: "ShippingDiscount",
    label: "Shipping Discount",
    description: "Specify conditions to apply a shipping discount to selected rates",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Discount if all qualify"
          },
          {
            value: "any",
            label: "Discount if any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      line_item_qualify_condition: {
        type: "select",
        description: "Set how line items are qualified",
        options: [
          {
            value: "any",
            label: "Qualify if any item in cart matches"
          },
          {
            value: "all",
            label: "Qualify if all items in cart match"
          }
        ]
      },
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      rate_to_discount_selector: [...RATE_SELECTORS, RATE_AND_SELECTOR, RATE_OR_SELECTOR],
      discount_to_apply: [...DISCOUNTS]
    }
  },
  {
    value: "ConditionallyHideRates",
    label: "Conditionally Hide Rates",
    description: "Selected shipping rates will be hidden based on conditions",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Hide if all qualify"
          },
          {
            value: "any",
            label: "Hide if any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      line_item_qualify_condition: {
        type: "select",
        description: "Set how line items are qualified",
        options: [
          {
            value: "any",
            label: "Qualify if any item in cart matches"
          },
          {
            value: "all",
            label: "Qualify if all items in cart match"
          }
        ]
      },
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      rate_to_hide_selector: [...RATE_SELECTORS, RATE_AND_SELECTOR, RATE_OR_SELECTOR]
    }
  },
  {
    value: "ChangeRateName",
    label: "Change Name",
    description: "Selected shipping rate names will be changed",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Change name if all qualify"
          },
          {
            value: "any",
            label: "Change name if any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      line_item_qualify_condition: {
        type: "select",
        description: "Set how line items are qualified",
        options: [
          {
            value: "any",
            label: "Qualify if any item in cart matches"
          },
          {
            value: "all",
            label: "Qualify if all items in cart match"
          }
        ]
      },
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      rate_to_change_selector: [...RATE_SELECTORS, RATE_AND_SELECTOR, RATE_OR_SELECTOR],
      new_name: {
        type: "text",
        description: "Selected rates will use this name"
      }
    }
  },
  {
    value: "ReorderShippingRates",
    label: "Reorder Rates",
    description: "Shipping rate order will be changed to the specified order",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Reorder if all qualify"
          },
          {
            value: "any",
            label: "Reorder if any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      line_item_qualify_condition: {
        type: "select",
        description: "Set how line items are qualified",
        options: [
          {
            value: "any",
            label: "Qualify if any item in cart matches"
          },
          {
            value: "all",
            label: "Qualify if all items in cart match"
          }
        ]
      },
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      order_from: {
        type: "select",
        description: "Set how the rates are ordered",
        options: [
          {
            value: "first_to_last",
            label: "Order from first to last"
          },
          {
            value: "last_to_first",
            "label": "Order from last to first"
          }
        ]
      },
      desired_order: {
        type: "array",
        description: "Rates will appear in the order specified (use rate names seperated by a comma). Only rates specified will be reordered."
      }
    }
  }
];

export default {
  classes,
  defaultCode,
  campaigns
};