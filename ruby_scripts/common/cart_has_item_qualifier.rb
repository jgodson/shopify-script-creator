class CartHasItemQualifier < Qualifier
  def initialize(quantity_or_subtotal, comparison_type, amount, item_selector)
    @quantity_or_subtotal = quantity_or_subtotal
    @comparison_type = comparison_type
    @amount = quantity_or_subtotal == :subtotal ? Money.new(cents: amount * 100) : amount
    @item_selector = item_selector
  end

  def match?(cart, selector = nil)
    raise "Must supply an item selector for the #{self.class}" if @item_selector.nil?
    case @quantity_or_subtotal
      when :quantity
        total = cart.line_items.reduce(0) do |total, item|
          total + (@item_selector&.match?(item) ? item.quantity : 0)
        end
      when :subtotal
        total = cart.line_items.reduce(Money.zero) do |total, item|
          total + (@item_selector&.match?(item) ? item.line_price : Money.zero)
        end
    end
    compare_amounts(total, @comparison_type, @amount)
  end
end
