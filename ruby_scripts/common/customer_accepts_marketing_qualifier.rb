class CustomerAcceptsMarketingQualifier < Qualifier
  def initialize(match_type)
    @invert = match_type == :does_not
  end

  def match?(cart, selector = nil)
    return false if cart.customer.nil?
    return @invert ^ cart.customer.accepts_marketing?
  end
end
