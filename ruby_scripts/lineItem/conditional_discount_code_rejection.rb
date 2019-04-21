class ConditionalDiscountCodeRejection < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, message)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = li_match_type == :default ? :any? : (li_match_type.to_s + '?').to_sym
    @message = message == "" ? "This discount code cannot be used at this time" : message
  end

  def run(cart)
    return unless cart.discount_code
    cart.discount_code.reject({message: @message}) if qualifies?(cart)
  end
end
