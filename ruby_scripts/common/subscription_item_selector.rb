class SubscriptionItemSelector < Selector
  def initialize(match_type)
    @invert = match_type == :not
  end

  def match?(line_item)
    @invert ^ !line_item.selling_plan_id.nil?
  end
end
