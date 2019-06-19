class ConditionallyHideRates < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, rate_selector)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = (li_match_type.to_s + '?').to_sym
    @rate_selector = rate_selector
  end

  def run(rates, cart)
    rates.delete_if { |rate| @rate_selector.match?(rate) } if qualifies?(cart)
  end
end
