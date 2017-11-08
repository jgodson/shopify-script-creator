const classes = `\
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