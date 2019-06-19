class CustomerEmailQualifier < Qualifier
  def initialize(match_type, match_condition, emails)
    @invert = match_type == :does_not
    @match_condition = match_condition
    @emails = emails.map(&:downcase)
  end

  def match?(cart, selector = nil)
    return false if cart.customer&.email.nil?
    customer_email = cart.customer.email
    case @match_condition
      when :match
        return @invert ^ @emails.include?(customer_email)
      else
        return @invert ^ partial_match(@match_condition, customer_email, @emails)
    end
  end
end
