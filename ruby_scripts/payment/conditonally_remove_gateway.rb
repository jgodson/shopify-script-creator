class ConditionallyRemoveGateway < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, gateway_selector)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = li_match_type == :default ? :any? : (li_match_type.to_s + '?').to_sym
    @gateway_selector = gateway_selector
  end

  def run(gateways, cart)
    gateways.delete_if { |gateway| @gateway_selector.match?(gateway) } if qualifies?(cart)
  end
end
