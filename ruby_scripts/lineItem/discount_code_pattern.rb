class DiscountCodePattern < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, percent_format, fixed_format)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = line_item_selector
    @percent_format = percent_format
    @fixed_format = fixed_format
  end

  def get_discount_type(code)
    percent_search = @percent_format.split('#').first
    fixed_search = @fixed_format.split('#').first
    if code.include?(percent_search)
      return :percent
    elsif code.include?(fixed_search)
      return :fixed
    end
    return nil
  end

  def get_discount_amount(type, code)
    start_num = nil
    end_num = nil
    start_search = nil

    case type
      when :percent
        start_num = @percent_format.index('#')
        end_num = @percent_format.rindex('#')
        start_search = @percent_format.split('#').first
      when :fixed
        start_num = @fixed_format.index('#')
        end_num = @fixed_format.rindex('#')
        start_search = @fixed_format.split('#').first
    end

    search_length = start_search.length
    start_index = code.index(start_search) + search_length
    return if start_index.nil? || start_num.nil?

    length = (end_num - start_num || 0) + 1
    puts code.slice(start_index, length)
    return code.slice(start_index, length).to_i(base=10)
  end

  def initialize_discount(code)
    type = get_discount_type(code)
    discount_amount = get_discount_amount(type, code)
    return if type == nil || discount_amount == nil
    return type == :fixed ? FixedTotalDiscount.new(discount_amount, code, :split) : PercentageDiscount.new(discount_amount, code)
  end

  def run(cart)
    return unless cart.discount_code
    return unless qualifies?(cart)

    @discount = initialize_discount(cart.discount_code.code)
    return unless @discount

    cart.line_items.each do |item|
      next unless @line_item_selector.nil? || @line_item_selector.match?(item)
      @discount.apply(item)
    end
  end
end
