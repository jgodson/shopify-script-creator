class CartAmountQualifier < Qualifier
  def initialize(cart_or_item, comparison_type, amount)
    @cart_or_item = cart_or_item == :default ? :cart : cart_or_item
    @comparison_type = comparison_type == :default ? :greater_than : comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    total = cart.subtotal_price
    if @cart_or_item == :item
      total = cart.line_items.reduce(Money.zero) do |total, item|
        total + (selector&.match?(item) ? item.original_line_price : Money.zero)
      end
    end
    compare_amounts(total, @comparison_type, @amount)
  end
end
