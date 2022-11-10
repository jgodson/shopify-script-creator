class GroupedTieredDiscount < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, discount_type, group_by, group_tags, discount_tiers)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = line_item_selector
    @discount_type = discount_type
    @group_by = group_by
    @group_tags = group_tags.map(&:downcase)
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
    raise "Group Tags can only be used when Group By is set to Product Tag" if @group_by != :product_tag && @group_tags.length > 0
    return unless qualifies?(cart)
    applicable_items = cart.line_items.select { |item| @line_item_selector.nil? || @line_item_selector.match?(item) }
    return unless applicable_items.length > 0

    groups = {}

    case @group_by
      when :product_id
        applicable_items.each do |item|
          id = item.variant.product.id
          groups[id] ? groups[id] << item : groups[id] = [item]
        end
      when :product_tag
        applicable_items.each do |item|
          product_tags = item.variant.product.tags.map(&:downcase)
          matching_tags = product_tags & @group_tags
          next unless matching_tags.length > 0
          id = matching_tags.first
          groups[id] ? groups[id] << item : groups[id] = [item]
        end
      when :product_vendor
        applicable_items.each do |item|
          id = item.variant.product.vendor
          next if id.empty?
          groups[id] ? groups[id] << item : groups[id] = [item]
        end
      when :product_type
        applicable_items.each do |item|
          id = item.variant.product.product_type
          next if id.empty?
          groups[id] ? groups[id] << item : groups[id] = [item]
        end
    end
    
    groups.each_value do |items|
      discountable_quantity = items.reduce(0) { |total, item| total + item.quantity }
      qualified_tiers = @discount_tiers.select { |tier| discountable_quantity >= tier[:tier].to_i }
      discount_amount = qualified_tiers.last[:discount].to_f
      discount_message = qualified_tiers.last[:message]
      discount = init_discount(discount_amount, discount_message)
      items.each { |item| discount.apply(item) }
    end
  end
end