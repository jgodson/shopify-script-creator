class BuyXGetX < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, buy_item_selector, get_item_selector, discount, buy_x, get_x, max_sets)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = buy_item_selector
    @get_item_selector = get_item_selector
    @discount = discount
    @buy_x = buy_x
    @get_x = get_x
    @max_sets = max_sets == 0 ? nil : max_sets
  end

  def run(cart)
    return unless qualifies?(cart)
    return unless cart.line_items.reduce(0) {|total, item| total += item.quantity } >= @buy_x
    applicable_buy_items = nil
    eligible_get_items = nil
    discountable_sets = 0

    # Find the items that qualify for buy_x
    if @line_item_selector.nil?
      applicable_buy_items = cart.line_items
    else
      applicable_buy_items = cart.line_items.select { |item| @line_item_selector.match?(item) }
    end

    # Find the items that qualify for get_x
    if @get_item_selector.nil?
      eligible_get_items = cart.line_items
    else
      eligible_get_items = cart.line_items.select {|item| @get_item_selector.match?(item) }
    end

    # Check if cart qualifies for discounts and limit the discount sets
    purchased_quantity = applicable_buy_items.reduce(0) { |total, item| total += item.quantity }
    discountable_sets = (@max_sets ? [purchased_quantity / @buy_x, @max_sets].min : purchased_quantity / @buy_x).to_i
    return if discountable_sets < 1
    discountable_quantity = (discountable_sets * @get_x).to_i
    # Apply the discounts (sort to discount lower priced items first)
    eligible_get_items = eligible_get_items.sort_by { |item| item.variant.price }
    eligible_get_items.each do |item|
      break if discountable_quantity == 0
      if item.quantity <= discountable_quantity
        @discount.apply(item)
        discountable_quantity -= item.quantity
      else
        new_item = item.split({ take: discountable_quantity })
        @discount.apply(new_item)
        cart.line_items << new_item
        discountable_quantity = 0
      end
    end
  end
end
