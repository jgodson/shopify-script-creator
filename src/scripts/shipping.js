const classes = `\
class AndSelector
  def initialize(*selectors)
    @selectors = selectors
  end

  def match?(item)
    @selectors.all? do |selector|
      return true if selector.nil?
      puts selector.match?(item) 
    end
  end
end

# Combines selectors together and returns true if any of them match
class OrSelector
  def initialize(*selectors)
    @selectors = selectors
  end

  def match?(item)
    @selectors.any? do |selector|
      next if selector.nil?
      selector.match?(item) 
    end
  end
end

class ProductTagSelector
  def initialize(tags)
    @tags = tags.map(&:downcase)
  end

  def match?(line_item)
    product_tags = line_item.variant.product.tags.to_a.map(&:downcase)
    (@tags & product_tags).length > 0
  end
end

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
# --------------- Script Configuration --------------- #
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
end`;

const defaultCode = `
CAMPAIGNS = [|].freeze

CAMPAIGNS.each do |campaign|
  campaign.run(Input.shipping_rates, Input.cart)
end

Output.shipping_rates = Input.shipping_rates`;

export default {
  classes,
  defaultCode,
  //campaigns
};