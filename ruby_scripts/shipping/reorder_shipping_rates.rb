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
end
