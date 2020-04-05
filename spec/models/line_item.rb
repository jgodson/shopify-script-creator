class LineItem
  attr_accessor :grams, :line_price, :properties, :variant, :quantity, :original_line_price, :message

  def initialize(variant, quantity)
    @variant = variant
    @quantity = quantity
    @grams = variant.grams * quantity
    @original_line_price = variant.price * quantity
    @line_price = @original_line_price
  end

  def split(take:)
    if take >= self.quantity
      raise "Take cannot be greater than or equal to the current quantity"
    end
    self.quantity -= take
    LineItem.new(self.variant, take)
  end

  def discounted?
    @line_price < @original_line_price
  end

  def line_price_changed?
    @original_line_price < @line_price
  end

  def change_line_price
    raise NotImplementedError
  end
end
