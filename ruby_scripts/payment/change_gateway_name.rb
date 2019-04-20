class ChangeGatewayName < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, gateway_selector, new_name)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = li_match_type == :default ? :any? : (li_match_type.to_s + '?').to_sym
    @gateway_selector = gateway_selector
    @new_name = new_name
  end

  def run(gateways, cart)
    return unless qualifies?(cart) && @gateway_selector
    gateways.each do|gateway|
      gateway.change_name(@new_name) if @gateway_selector.match?(gateway)
    end
  end
end
