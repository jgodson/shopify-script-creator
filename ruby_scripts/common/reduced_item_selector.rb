class ReducedItemSelector < Selector
  def initialize(match_type)
    @invert = match_type == :not
  end

  def match?(line_item)
    @invert ^ line_item.discounted?
  end
end
