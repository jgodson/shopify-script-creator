class TieredDiscount < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, discount_type, tier_type, discount_tiers)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = line_item_selector
    @discount_type = discount_type
    @tier_type = tier_type == :default ? :customer_tag : tier_type
    @discount_tiers = discount_tiers.sort_by {|tier| tier[:discount].to_f }
  end

  def init_discount(amount, message)
    case @discount_type
      when :fixed
        return FixedTotalDiscount.new(amount, message, :split)
      when :percent
        return PercentageDiscount.new(amount, message)
      when :per_item
        return FixedItemDiscount.new(amount, message)
    end
  end

  def run(cart)
    return unless qualifies?(cart)

    applicable_items = cart.line_items.select { |item| @line_item_selector.nil? || @line_item_selector.match?(item) }
    case @tier_type
      when :customer_tag
        return if cart.customer.nil?
        customer_tags = cart.customer.tags.map(&:downcase)
        qualified_tiers = @discount_tiers.select { |tier| customer_tags.include?(tier[:tier].downcase) }
      when :cart_subtotal
        cart_total = cart.subtotal_price
        qualified_tiers = @discount_tiers.select { |tier| cart_total >= Money.new(cents: tier[:tier].to_i * 100) }
      when :discountable_total
        discountable_total = applicable_items.reduce(Money.zero) { |total, item| total + item.line_price }
        qualified_tiers = @discount_tiers.select { |tier| discountable_total >= Money.new(cents: tier[:tier].to_i * 100) }
      when :discountable_total_items
        discountable_quantity = applicable_items.reduce(0) { |total, item| total + item.quantity }
        qualified_tiers = @discount_tiers.select { |tier| discountable_quantity >= tier[:tier].to_i }
      when :cart_items
        cart_quantity = cart.line_items.reduce(0) { |total, item| total + item.quantity }
        qualified_tiers = @discount_tiers.select { |tier| cart_quantity >= tier[:tier].to_i }
    end

    if @tier_type == :line_quantity
      applicable_items.each do |item|
        qualified_tiers = @discount_tiers.select { |tier| item.quantity >= tier[:tier].to_i }
        next if qualified_tiers.empty?

        discount_amount = qualified_tiers.last[:discount].to_f
        discount_message = qualified_tiers.last[:message]
        discount = init_discount(discount_amount, discount_message)
        discount.apply(item)
        discount.apply_final_discount if discount.respond_to?(:apply_final_discount)
      end
    else
      return if qualified_tiers.empty?
      discount_amount = qualified_tiers.last[:discount].to_f
      discount_message = qualified_tiers.last[:message]

      @discount = init_discount(discount_amount, discount_message)
      applicable_items.each { |item| @discount.apply(item) }
    end
  end
end
