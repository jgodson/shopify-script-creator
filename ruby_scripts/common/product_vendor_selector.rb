class ProductVendorSelector < Selector
  def initialize(match_type, vendors)
    @invert = match_type != :is_one
    @vendors = vendors.map(&:downcase)
  end

  def match?(line_item)
    @invert ^ @vendors.include?(line_item.variant.product.vendor.downcase)
  end
end
