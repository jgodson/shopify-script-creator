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
end
