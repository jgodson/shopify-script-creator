class OrSelector
  def initialize(*conditions)
    @conditions = conditions.compact
  end

  def match?(item, selector = nil)
    @conditions.any? do |condition|
      if selector
        condition.match?(item, selector)
      else
        condition.match?(item)
      end
    end
  end
end
