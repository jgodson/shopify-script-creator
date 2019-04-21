class Cart
  attr_accessor :customer, :shipping_address, :discount_code, :line_items, :presentment_currency

  def initialize(line_items, customer, shipping_address, discount_code)
    @line_items = line_items
    @customer = customer
    @shipping_address = shipping_address
    @discount_code = discount_code
    @original_price = line_items.reduce(Money.zero) { |sum, item| sum + item.original_line_price }
  end

  def subtotal_price
    line_items.reduce(Money.zero) { |sum, item| sum + item.line_price }
  end

  def subtotal_price_was
    @original_price
  end

  def subtotal_price_changed?
    @original_price > @subtotal_price
  end

  def total_weight
    line_items.reduce(0) { |sum, item| sum + item.grams }
  end
end
