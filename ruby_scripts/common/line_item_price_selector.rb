class LineItemPriceSelector < Selector
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(line_item)
    case @comparison_type
      when :greater_than_equal
        line_item.variant.price >= @amount
      when :less_than_equal
        line_item.variant.price <= @amount
    end
  end
end
