class ZipCodeQualifier < Qualifier
  def initialize(match_type, match_condition, zips)
    @match_condition = match_condition
    @invert = match_type == :does_not
    @zips = zips.map(&:downcase).map {|z| z.gsub(' ', '')}
  end

  def match?(cart, selector = nil)
    return false if cart.shipping_address&.zip.nil?
    zip_code = cart.shipping_address.zip.downcase.gsub(' ', '')
    case @match_condition
      when :match
        return @invert ^ @zips.include?(zip_code)
      else
        return @invert ^ partial_match(@match_condition, zip_code, @zips)
    end
  end
end
