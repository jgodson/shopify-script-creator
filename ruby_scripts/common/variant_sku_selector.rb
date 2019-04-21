class VariantSkuSelector < Selector
  def initialize(match_type, match_condition, skus)
    @invert = match_type == :does_not
    @match_condition = match_condition == :default ? :match : match_condition
    @skus = skus.map(&:downcase)
  end

  def match?(line_item)
    variant_skus = line_item.variant.skus.to_a.map(&:downcase)
    case @match_condition
      when :match
        return @invert ^ ((@skus & variant_skus).length > 0)
      else
        return @invert ^ partial_match(@match_condition, variant_skus, @skus)
    end
  end
end
