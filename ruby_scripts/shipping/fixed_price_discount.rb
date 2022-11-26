class FixedPriceDiscount
  def initialize(amount, message)
    @amount = Money.new(cents: amount * 100)
    @message = message
  end

  def apply(rate)
    discount_amount = @amount > rate.price ? rate.price : rate.price - @amount
    rate.apply_discount(discount_amount, { message: @message })
  end
end
