class RateSourceSelector < Selector
  def initialize(match_type, sources)
    @invert = match_type == :not_one
    @sources = sources.map(&:downcase)
  end

  def match?(shipping_rate)
    source = shipping_rate.source.downcase
    @invert ^ @sources.include?(source)
  end
end
