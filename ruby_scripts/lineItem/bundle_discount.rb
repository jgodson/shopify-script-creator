class BundleDiscount < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, discount, full_bundles_only, bundle_products)
    super(condition, customer_qualifier, cart_qualifier, nil)
    @bundle_products = bundle_products
    @discount = discount
    @full_bundles_only = full_bundles_only
    @split_items = []
    @bundle_items = []
  end

  def check_bundles(cart)
      bundled_items = @bundle_products.map do |bitem|
        quantity_required = bitem[:quantity].to_i
        qualifiers = bitem[:qualifiers]
        type = bitem[:type].to_sym
        case type
          when :ptype
            items = cart.line_items.select { |item| qualifiers.include?(item.variant.product.product_type) && !item.discounted? }
          when :ptag
            items = cart.line_items.select { |item| (qualifiers & item.variant.product.tags).length > 0 && !item.discounted? }
          when :pid
            qualifiers.map!(&:to_i)
            items = cart.line_items.select { |item| qualifiers.include?(item.variant.product.id) && !item.discounted? }
          when :vid
            qualifiers.map!(&:to_i)
            items = cart.line_items.select { |item| qualifiers.include?(item.variant.id) && !item.discounted? }
          when :vsku
            items = cart.line_items.select { |item| (qualifiers & item.variant.skus).length > 0 && !item.discounted? }
        end

        total_quantity = items.reduce(0) { |total, item| total + item.quantity }
        {
          has_all: total_quantity >= quantity_required,
          total_quantity: total_quantity,
          quantity_required: quantity_required,
          total_possible: (total_quantity / quantity_required).to_i,
          items: items
        }
      end

      max_bundle_count = bundled_items.map{ |bundle| bundle[:total_possible] }.min if @full_bundles_only
      if bundled_items.all? { |item| item[:has_all] }
        if @full_bundles_only
          bundled_items.each do |bundle|
            bundle_quantity = bundle[:quantity_required] * max_bundle_count
            split_out_extra_quantity(cart, bundle[:items], bundle[:total_quantity], bundle_quantity)
          end
        else
          bundled_items.each do |bundle|
            bundle[:items].each do |item|
              @bundle_items << item
              cart.line_items.delete(item)
            end
          end
        end
        return true
      end
      false
  end

  def split_out_extra_quantity(cart, items, total_quantity, quantity_required)
    items_to_split = quantity_required
    items.each do |item|
      break if items_to_split == 0
      if item.quantity > items_to_split
        @bundle_items << item.split({take: items_to_split})
        @split_items << item
        items_to_split = 0
      else
        @bundle_items << item
        split_quantity = item.quantity
        items_to_split -= split_quantity
      end
      cart.line_items.delete(item)
    end
    cart.line_items.concat(@split_items)
    @split_items.clear
  end

  def run(cart)
    raise "Campaign requires a discount" unless @discount
    return unless qualifies?(cart)

    if check_bundles(cart)
      @bundle_items.each { |item| @discount.apply(item) }
    end
    @bundle_items.reverse.each { |item| cart.line_items.prepend(item) }
  end
end
