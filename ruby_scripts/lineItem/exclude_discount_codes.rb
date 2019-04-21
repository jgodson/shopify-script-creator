class ExcludeDiscountCodes < Qualifier
  def initialize(behaviour, message, match_type = :reject_except, discount_codes = [])
    @reject = behaviour == :apply_script
    @message = message == "" ? "Discount codes cannot be used with this offer" : message
    @match_type = match_type
    @discount_codes = discount_codes.map(&:downcase)
  end

  def match?(cart, selector = nil)
    return true if cart.discount_code.nil?
    return false if !@reject
    discount_code = cart.discount_code.code.downcase
    should_reject = true
    case @match_type
      when :reject_except
        should_reject = !@discount_codes.include?(discount_code)
      when :accept_except
        should_reject = @discount_codes.include?(discount_code)
    end
    if should_reject
      cart.discount_code.reject({message: @message})
    end
    return true
  end
end
