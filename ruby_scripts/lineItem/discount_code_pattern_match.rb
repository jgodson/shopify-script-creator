class DiscountCodePatternMatch < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, discount, formats)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = line_item_selector
    @discount = discount
    @formats = formats
  end

  def matches_pattern(format, code)
    expected = format.downcase.split('-')
    parts = code.downcase.split('-')
    return false if parts.length != expected.length

    parts.each_with_index do |part, index|
      partchars = part.split('')
      expectchars = expected[index].split('')

      return false if partchars.length != expectchars.length

      expectchars.each_with_index do |c, index|
        next if c == '*'
        return false if partchars[index] != c
      end
    end

    return true
  end

  def run(cart)
    discount_code = cart.discount_code&.code
    return unless discount_code
    return unless qualifies?(cart)

    return unless @formats.any? { |f| matches_pattern(f, discount_code) }

    cart.line_items.each do |item|
      next unless @line_item_selector.nil? || @line_item_selector.match?(item)
      @discount.apply(item)
    end
  end
end
