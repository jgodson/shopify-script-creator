class CustomerOrderCountQualifier < Qualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = amount
  end

  def match?(cart, selector = nil)
    return false if cart.customer.nil?
    total = cart.customer.orders_count
    compare_amounts(total, @comparison_type, @amount)
  end
end
