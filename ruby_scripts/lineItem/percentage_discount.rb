class PercentageDiscount
  def initialize(percent, message)
    @discount = (100 - percent) / 100.0
    @message = message
  end

  def apply(line_item)
    line_item.change_line_price(line_item.line_price * @discount, message: @message)
  end
end
