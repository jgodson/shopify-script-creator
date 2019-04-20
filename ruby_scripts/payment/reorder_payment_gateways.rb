class ReorderPaymentGateways < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, order_from, desired_order)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = li_match_type == :default ? :any? : (li_match_type.to_s + '?').to_sym
    @reverse = order_from == :last_to_first
    @desired_order = desired_order.map(&:downcase)
  end

  def run(gateways, cart)
    return unless qualifies?(cart)
    new_order = []
    leftover_gateways = []
    gateways.each { |gateway| new_order << gateway.name if @desired_order.include?(gateway.name.downcase) }
    return if new_order.empty?
    new_order = new_order.sort_by { |name| @desired_order.index(name.downcase) }
    gateways.each { |gateway| leftover_gateways << gateway.name unless new_order.include?(gateway.name) }
    if @reverse
      new_order.reverse!
      leftover_gateways.reverse.each { |name| new_order.unshift(name) }
    else
      leftover_gateways.each { |name| new_order << name }
    end
    gateways.sort_by! { |gateway| new_order.index(gateway.name) }
  end
end
