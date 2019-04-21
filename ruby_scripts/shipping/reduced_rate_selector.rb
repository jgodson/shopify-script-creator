class ReducedRateSelector < Selector
  def initialize(match_type)
    @invert = match_type == :not
  end

  def match?(rate)
    return @invert if rate.instance_variable_get(:@adjustments).empty?
    return @invert ^ rate.instance_variable_get(:@adjustments).any? do |adjustment|
      next unless adjustment&.property == :price
      adjustment.old_value.cents > adjustment.new_value.cents
    end
  end
end
