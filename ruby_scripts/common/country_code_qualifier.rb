class CountryCodeQualifier < Qualifier
  def initialize(match_type, country_codes)
    @invert = match_type == :not_one
    @country_codes = country_codes.map(&:upcase)
  end

  def match?(cart, selector = nil)
    shipping_address = cart.shipping_address
    return false if shipping_address&.country_code.nil?
    @invert ^ @country_codes.include?(shipping_address.country_code.upcase)
  end
end
