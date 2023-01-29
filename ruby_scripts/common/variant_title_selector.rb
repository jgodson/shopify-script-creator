class VariantTitleSelector < Selector
    def initialize(match_type, variant_titles)
      @invert = match_type == :not_one
      @variant_titles = variant_titles.map { |title| title.downcase }
    end
  
    def match?(line_item)
      @invert ^ @variant_titles.include?(line_item.variant.title.downcase)
    end
  end
  