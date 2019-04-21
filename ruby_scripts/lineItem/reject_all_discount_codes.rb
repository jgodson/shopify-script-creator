class RejectAllDiscountCodes < Campaign
  def initialize(message)
    @message = message == "" ? "Discount codes are disabled" : message
  end

  def run(cart)
    cart.discount_code.reject({message: @message}) unless cart.discount_code.nil?
  end
end
