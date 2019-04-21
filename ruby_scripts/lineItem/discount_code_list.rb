class DiscountCodeList < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, discount_list)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = line_item_selector
    @discount_list = discount_list
  end

  def init_discount(type, amount, message)
    case type
      when :fixed
        return FixedTotalDiscount.new(amount, message, :split)
      when :percent
        return PercentageDiscount.new(amount, message)
      when :per_item
        return FixedItemDiscount.new(amount, message)
    end
  end

  def get_discount_code_type(discount_code)
    case discount_code
      when CartDiscount::Percentage
        return :percent
      when CartDiscount::FixedAmount
        return :fixed
      else
        return nil
    end
  end

  def run(cart)
    return unless cart.discount_code
    return unless qualifies?(cart)

    applied_code = cart.discount_code.code.downcase
    applicable_discount = @discount_list.select { |item| item[:code].downcase == applied_code }
    return if applicable_discount.empty?
    raise "#{applied_code} matches multiple discounts" if applicable_discount.length > 1

    applicable_discount = applicable_discount.first
    case applicable_discount[:type].downcase
      when 'p', 'percent'
        discount_type = :percent
      when 'f', 'fixed'
        discount_type = :fixed
      when 'per_item'
        discount_type = :per_item
      when 'c', 'code'
        discount_type = get_discount_code_type(cart.discount_code)
    end
    return if discount_type.nil?

    @discount = init_discount(discount_type, applicable_discount[:amount].to_f, applied_code)
    cart.line_items.each do |item|
      next unless @line_item_selector.nil? || @line_item_selector.match?(item)
      @discount.apply(item)
    end
  end
end
