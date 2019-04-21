class CustomerTagQualifier < Qualifier
  def initialize(match_type, match_condition, tags)
    @match_condition = match_condition == :default ? :match : match_condition
    @invert = match_type == :does_not
    @tags = tags.map(&:downcase)
  end

  def match?(cart, selector = nil)
    return true if cart.customer.nil? && @invert
    return false if cart.customer.nil?
    customer_tags = cart.customer.tags.to_a.map(&:downcase)
    case @match_condition
      when :match
        return @invert ^ ((@tags & customer_tags).length > 0)
      else
        return @invert ^ partial_match(@match_condition, customer_tags, @tags)
    end
  end
end
