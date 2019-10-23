class NoCodeQualifier < Qualifier
  def match?(cart, selector = nil)
    return true if cart.discount_code.nil?
    false
  end
end
