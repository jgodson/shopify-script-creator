class ProductTagSelector < Selector
  def initialize(match_type, match_condition, tags)
    @match_condition = match_condition == :default ? :match : match_condition
    @invert = match_type == :does_not
    @tags = tags.map(&:downcase)
  end

  def match?(line_item)
    product_tags = line_item.variant.product.tags.to_a.map(&:downcase)
    case @match_condition
      when :match
        return @invert ^ ((@tags & product_tags).length > 0)
      else
        return @invert ^ partial_match(@match_condition, product_tags, @tags)
    end
  end
end
