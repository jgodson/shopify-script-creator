class SaleItemSelector < Selector
  def initialize(match_type)
    @invert = match_type == :is
  end

  def match?(line_item)
    @invert ^ (line_item.variant.compare_at_price.nil? || line_item.variant.compare_at_price <= line_item.variant.price)
  end
end
