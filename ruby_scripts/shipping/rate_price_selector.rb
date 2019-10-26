class RatePriceSelector < Selector
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(shipping_rate)
    compare_amounts(shipping_rate.price, @comparison_type, @amount)
  end

  def compare_amounts(compare, comparison_type, compare_to)
    case comparison_type
      when :greater_than
        return compare > compare_to
      when :greater_than_or_equal
        return compare >= compare_to
      when :less_than
        return compare < compare_to
      when :less_than_or_equal
        return compare <= compare_to
      when :equal_to
        return compare == compare_to
      else
        raise "Invalid comparison type"
    end
  end
end
