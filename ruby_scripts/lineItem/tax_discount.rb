class TaxDiscount
  def initialize(amount, message)
    @amount = amount
    @message = message
  end

  def apply(line_item)
    calculated_tax_fraction = @amount / (100 + @amount)
    item_price = (line_item.line_price * (1 /line_item.quantity))
    item_tax = item_price * calculated_tax_fraction
    per_item_price = item_price - item_tax
    new_line_price = per_item_price * line_item.quantity
    line_item.change_line_price(new_line_price, message: @message)
  end
end
