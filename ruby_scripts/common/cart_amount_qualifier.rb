class CartAmountQualifier < Qualifier
  def initialize(behaviour, comparison_type, amount)
    @behaviour = behaviour == :default ? :cart : behaviour
    @comparison_type = comparison_type == :default ? :greater_than : comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    total = cart.subtotal_price
    if @behaviour == :item || @behaviour == :diff_item
      total = cart.line_items.reduce(Money.zero) do |total, item|
        total + (selector&.match?(item) ? item.line_price : Money.zero)
      end
    end
    case @behaviour
      when :cart, :item
        compare_amounts(total, @comparison_type, @amount)
      when :diff_cart
        compare_amounts(cart.subtotal_price_was - @amount, @comparison_type, total)
      when :diff_item
        original_line_total = cart.line_items.reduce(Money.zero) do |total, item|
          total + (selector&.match?(item) ? item.original_line_price : Money.zero)
        end
        compare_amounts(original_line_total - @amount, @comparison_type, total)
    end
  end
end
