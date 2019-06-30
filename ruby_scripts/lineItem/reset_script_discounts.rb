class ResetScriptDiscounts < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, item_selector, variables)
    super(condition, customer_qualifier, cart_qualifier, item_selector)
    @variables = variables
  end

  def run(cart)
    return unless qualifies?(cart)
    cart.instance_variable_set(:@line_items, VARIABLES[:crt_itms])
    @variables.each { |var| VARIABLES[var[:name]] = var[:value] }
  end
end
