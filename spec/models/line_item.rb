class LineItem
  attr_accessor :grams, :line_price, :properties, :variant, :quantity
  attr_reader :message, :original_line_price

  def initialize(variant, quantity)
    @variant = variant
    @quantity = quantity
    @grams = variant.grams * quantity
    @original_price = variant.price * quantity
    @line_price = @original_price
  end

  def discounted?
    @line_price < @original_price
  end

  def line_price_changed?
    @original_price < @line_price
  end

  def change_line_price

  end
end
