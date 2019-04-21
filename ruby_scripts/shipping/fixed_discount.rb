class FixedDiscount
  def initialize(amount, message)
    @amount = Money.new(cents: amount * 100)
    @message = message
  end

  def apply(rate)
    discount_amount = rate.price - @amount < Money.zero ? rate.price : @amount
    rate.apply_discount(discount_amount, { message: @message })
  end
end
