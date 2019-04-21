class ProductIdSelector < Selector
  def initialize(match_type, product_ids)
    @invert = match_type == :not_one
    @product_ids = product_ids.map { |id| id.to_i }
  end

  def match?(line_item)
    @invert ^ @product_ids.include?(line_item.variant.product.id)
  end
end
