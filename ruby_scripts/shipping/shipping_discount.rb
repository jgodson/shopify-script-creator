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
end
