class CountryAndProvinceQualifier < Qualifier
  def initialize(match_type, country_map)
    @invert = match_type == :not_one
    @country_map = country_map
  end

  def match?(cart, selector = nil)
    return if cart.shipping_address&.country_code.nil?
    country_code = cart.shipping_address.country_code.upcase
    return @invert unless @country_map.key?(country_code) && cart.shipping_address.province_code
    province_code = cart.shipping_address.province_code.upcase
    @invert ^ @country_map[country_code].include?(province_code)
  end
end
