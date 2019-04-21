class PercentageDiscount
  def initialize(percent, message)
    @percent = Decimal.new(percent) / 100
    @message = message
  end

  def apply(rate)
    rate.apply_discount(rate.price * @percent, { message: @message })
  end
end
