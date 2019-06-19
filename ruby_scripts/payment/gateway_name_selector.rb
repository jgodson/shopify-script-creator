class GatewayNameSelector < Selector
  def initialize(match_type, match_condition, names)
    @match_condition = match_condition
    @invert = match_type == :does_not
    @names = names.map(&:downcase)
  end

  def match?(gateway)
    name = gateway.name.downcase
    case @match_condition
      when :match
        return @invert ^ @names.include?(name)
      else
        return @invert ^ partial_match(@match_condition, name, @names)
    end
  end
end
