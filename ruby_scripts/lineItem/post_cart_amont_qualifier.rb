class PostCartAmountQualifier < Qualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type == :default ? :greater_than : comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    total = cart.subtotal_price
    compare_amounts(total, @comparison_type, @amount)
  end
end
