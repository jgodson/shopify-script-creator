class SetVariables < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, item_selector, variables)
    super(condition, customer_qualifier, cart_qualifier, item_selector)
    @variables = variables
  end

  def run(cart)
    return unless qualifies?(cart)
    @variables.each { |var| VARIABLES[var[:name]] = var[:value] }
  end
end
