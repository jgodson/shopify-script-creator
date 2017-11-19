import Common from './common';

const classes = `\
############### SHIPPING SCRIPT CLASSES ###############
# Checks if a rate matches a given name or not.
# Can do a :partial or :exact match
class RateNameSelector
  def initialize(name, match_type)
    @name = name.downcase
    @match_type = match_type
  end
  
  def match?(rate)
    case @match_type
      when :partial
        rate.name.downcase.include?(@name)
      when :exact
        rate.name.downcase === @name
      else
        raise "Invalid match type. Must be :partial or :exact"
    end
  end
end

class HideRateUnlessConditionsMet
  def initialize(cart_qualifier, line_item_qualifier, rate_selector)
    @cart_qualifier = cart_qualifier
    @line_item_qualifier = line_item_qualifier
    @rate_selector = rate_selector
  end

  def run(rates, cart)
    return unless @cart_qualifier.nil? || @cart_qualifier.match?(cart)
    unless @line_item_qualifier.nil? || cart.line_items.any? { |item| @line_item_qualifier.match?(item) }
      rates.delete_if do |rate|
        @rate_selector.match?(rate)
      end
    end
  end
end

# Takes an array of rate names and matches a given rate
class RateSelector
  def initialize(rate_names)
    @rate_names = rate_names.map { |name| name.downcase! }
  end
  
  def match?(rate)
    @rate_names.include?(rate.name.downcase)
  end
end

# Applies a percentage discount to a given rate
class PercentageDiscount
  def initialize(percent, message)
    @percent = Decimal.new(percent) / 100
    @message = message
  end
  
  def apply(rate)
    rate.apply_discount(rate.price * @percent, { message: @message })
  end 
end

# Applies a fixed discount to a given rate
class FixedDiscount
  def initialize(amount, message)
    @amount = Money.new(cents: amount * 100)
    @message = message
  end
  
  def apply(rate)
    discount_amount = rate.price - @amount < 0 ? rate.price : @amount
    rate.apply_discount(discount_amount, { message: @message })
  end
end

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
        return true if value.empty?
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
        return match
      end
    end
  end
end

# COUNTRY MAP = { "COUNTRY_CODE" => ["PROVINCE_CODE_1", "PROVINCE_CODE_2", etc] }
class CountryAndProvinceSelector
  def initialize(country_map)
    @country_map = country_map
  end

  def match?(cart)
    address = cart.shipping_address
    address && @country_map.key?(address.country_code.upcase) && @country_map[address.country_code.upcase].include?(address.province_code.upcase)
  end
end

# Accepts a qualifier, rate selector and a discount to apply to shipping rates
class ShippingDiscount
  def initialize(qualifier, rate_selector, discount)
    @qualifier = qualifier
    @rate_selector = rate_selector
    @discount = discount
  end
  
  def run(cart, rates)
    return unless @qualifier.match?(cart)
    rates.each do |rate|
      next unless @rate_selector.match?(rate)
      @discount.apply(rate)
    end
  end
end

############### CAMPAIGNS ###############
`;

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

const DISCOUNTS = [
  {
    value: "PercentageDiscount",
    label: "Percentage Discount",
    description: "Discounts the shipping rate by a percentage",
    inputs: {
      percent: {
        type: "number",
        description: "Percent discount to apply"
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
    description: "Discounts the shipping rate by a fixed amount",
    inputs: {
      amount: {
        type: "number",
        description: "Total discount to apply"
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

];

export default {
  classes,
  defaultCode,
  campaigns
};