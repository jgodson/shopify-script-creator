class FixedItemDiscount
  def initialize(amount, message)
    @amount = Money.new(cents: amount * 100)
    @message = message
  end

  def apply(line_item)
    per_item_price = line_item.variant.price
    per_item_discount = [(@amount - per_item_price), @amount].max
    discount_to_apply = [(per_item_discount * line_item.quantity), line_item.line_price].min
    line_item.change_line_price(line_item.line_price - discount_to_apply, {message: @message})
  end
end
