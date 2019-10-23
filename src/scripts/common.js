const classes = {
  AndSelector: `
class AndSelector
  def initialize(*conditions)
    @conditions = conditions.compact
  end

  def match?(item, selector = nil)
    @conditions.all? do |condition|
      if selector
        condition.match?(item, selector)
      else
        condition.match?(item)
      end
    end
  end
end`,

  Campaign: `
class Campaign
  def initialize(condition, *qualifiers)
    @condition = (condition.to_s + '?').to_sym
    @qualifiers = PostCartAmountQualifier ? [] : [] rescue qualifiers.compact
    @line_item_selector = qualifiers.last unless @line_item_selector
    qualifiers.compact.each do |qualifier|
      is_multi_select = qualifier.instance_variable_get(:@conditions).is_a?(Array)
      if is_multi_select
        qualifier.instance_variable_get(:@conditions).each do |nested_q|
          @post_amount_qualifier = nested_q if nested_q.is_a?(PostCartAmountQualifier)
          @qualifiers << qualifier
        end
      else
        @post_amount_qualifier = qualifier if qualifier.is_a?(PostCartAmountQualifier)
        @qualifiers << qualifier
      end
    end if @qualifiers.empty?
  end

  def qualifies?(cart)
    return true if @qualifiers.empty?
    @unmodified_line_items = cart.line_items.map do |item|
      new_item = item.dup
      new_item.instance_variables.each do |var|
        val = item.instance_variable_get(var)
        new_item.instance_variable_set(var, val.dup) if val.respond_to?(:dup)
      end
      new_item
    end if @post_amount_qualifier
    @qualifiers.send(@condition) do |qualifier|
      is_selector = false
      if qualifier.is_a?(Selector) || qualifier.instance_variable_get(:@conditions).any? { |q| q.is_a?(Selector) }
        is_selector = true
      end rescue nil
      if is_selector
        raise "Missing line item match type" if @li_match_type.nil?
        cart.line_items.send(@li_match_type) { |item| qualifier.match?(item) }
      else
        qualifier.match?(cart, @line_item_selector)
      end
    end
  end

  def run_with_hooks(cart)
    before_run(cart) if respond_to?(:before_run)
    run(cart)
    after_run(cart)
  end

  def after_run(cart)
    @discount.apply_final_discount if @discount && @discount.respond_to?(:apply_final_discount)
    revert_changes(cart) unless @post_amount_qualifier.nil? || @post_amount_qualifier.match?(cart)
  end

  def revert_changes(cart)
    cart.instance_variable_set(:@line_items, @unmodified_line_items)
  end
end`,

  CartAmountQualifier: `
class CartAmountQualifier < Qualifier
  def initialize(behaviour, comparison_type, amount)
    @behaviour = behaviour
    @comparison_type = comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    total = cart.subtotal_price
    if @behaviour == :item || @behaviour == :diff_item
      total = cart.line_items.reduce(Money.zero) do |total, item|
        total + (selector&.match?(item) ? item.line_price : Money.zero)
      end
    end
    case @behaviour
      when :cart, :item
        compare_amounts(total, @comparison_type, @amount)
      when :diff_cart
        compare_amounts(cart.subtotal_price_was - @amount, @comparison_type, total)
      when :diff_item
        original_line_total = cart.line_items.reduce(Money.zero) do |total, item|
          total + (selector&.match?(item) ? item.original_line_price : Money.zero)
        end
        compare_amounts(original_line_total - @amount, @comparison_type, total)
    end
  end
end`,

  CartHasItemQualifier: `
class CartHasItemQualifier < Qualifier
  def initialize(quantity_or_subtotal, comparison_type, amount, item_selector)
    @quantity_or_subtotal = quantity_or_subtotal
    @comparison_type = comparison_type
    @amount = quantity_or_subtotal == :subtotal ? Money.new(cents: amount * 100) : amount
    @item_selector = item_selector
  end

  def match?(cart, selector = nil)
    raise "Must supply an item selector for the #{self.class}" if @item_selector.nil?
    case @quantity_or_subtotal
      when :quantity
        total = cart.line_items.reduce(0) do |total, item|
          total + (@item_selector&.match?(item) ? item.quantity : 0)
        end
      when :subtotal
        total = cart.line_items.reduce(Money.zero) do |total, item|
          total + (@item_selector&.match?(item) ? item.line_price : Money.zero)
        end
    end
    compare_amounts(total, @comparison_type, @amount)
  end
end`,

  CartQuantityQualifier: `
class CartQuantityQualifier < Qualifier
  def initialize(total_method, comparison_type, quantity)
    @total_method = total_method
    @comparison_type = comparison_type
    @quantity = quantity
  end

  def match?(cart, selector = nil)
    case @total_method
      when :item
        total = cart.line_items.reduce(0) do |total, item|
          total + ((selector ? selector.match?(item) : true) ? item.quantity : 0)
        end
      when :cart
        total = cart.line_items.reduce(0) { |total, item| total + item.quantity }
    end
    if @total_method == :line_any || @total_method == :line_all
      method = @total_method == :line_any ? :any? : :all?
      qualified_items = cart.line_items.select { |item| selector ? selector.match?(item) : true }
      qualified_items.send(method) { |item| compare_amounts(item.quantity, @comparison_type, @quantity) }
    else
      compare_amounts(total, @comparison_type, @quantity)
    end
  end
end`,

  CodeQualifier: `
class CodeQualifier < Qualifier
  def initialize(match_type, match_condition, codes)
    @match_condition = match_condition
    @invert = match_type == :does_not
    @codes = codes.map(&:downcase)
  end

  def match?(cart, selector = nil)
    return false if cart.discount_code.nil?
    code = cart.discount_code.code.downcase
    case @match_condition
      when :match
        return @invert ^ @codes.include?(code)
      else
        return @invert ^ partial_match(@match_condition, code, @codes)
    end
  end
end`,

  CountryAndProvinceQualifier: `
class CountryAndProvinceQualifier < Qualifier
  def initialize(match_type, country_map)
    @invert = match_type == :not_one
    @country_map = country_map
  end

  def match?(cart, selector = nil)
    return if cart.shipping_address&.country_code.nil?
    country_code = cart.shipping_address.country_code.upcase
    return @invert unless @country_map.key?(country_code) && cart.shipping_address.province_code
    province_code = cart.shipping_address.province_code.upcase
    @invert ^ @country_map[country_code].include?(province_code)
  end
end`,

  CountryCodeQualifier: `
class CountryCodeQualifier < Qualifier
  def initialize(match_type, country_codes)
    @invert = match_type == :not_one
    @country_codes = country_codes.map(&:upcase)
  end

  def match?(cart, selector = nil)
    shipping_address = cart.shipping_address
    return false if shipping_address&.country_code.nil?
    @invert ^ @country_codes.include?(shipping_address.country_code.upcase)
  end
end`,

  CustomerAcceptsMarketingQualifier: `
class CustomerAcceptsMarketingQualifier < Qualifier
  def initialize(match_type)
    @invert = match_type == :does_not
  end

  def match?(cart, selector = nil)
    return false if cart.customer.nil?
    return @invert ^ cart.customer.accepts_marketing?
  end
end`,

  CustomerEmailQualifier: `
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
end`,

  CustomerOrderCountQualifier: `
class CustomerOrderCountQualifier < Qualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = amount
  end

  def match?(cart, selector = nil)
    return false if cart.customer.nil?
    total = cart.customer.orders_count
    compare_amounts(total, @comparison_type, @amount)
  end
end`,

  CustomerTagQualifier: `
class CustomerTagQualifier < Qualifier
  def initialize(match_type, match_condition, tags)
    @match_condition = match_condition
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
end`,

  CustomerTotalSpentQualifier: `
class CustomerTotalSpentQualifier < Qualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    return false if cart.customer.nil?
    total = cart.customer.total_spent
    compare_amounts(total, @comparison_type, @amount)
  end
end`,

  FullAddressQualifier: `
class FullAddressQualifier
  def initialize(addresses)
    @addresses = addresses
  end

  def match?(cart, selector = nil)
    return false if cart.shipping_address.nil?

    @addresses.any? do |accepted_address|
      match_type = accepted_address[:match_type].to_sym

      cart.shipping_address.to_hash.all? do |key, value|
        key = key.to_sym
        next true unless accepted_address[key]
        next true if accepted_address[key].length === 0
        next false if value.nil?
        value.downcase!

        match = accepted_address[key].any? do |potential_address|
          potential_address.downcase!

          case match_type
            when :partial
              value.include?(potential_address)
            when :exact
              potential_address == value
          end
        end

        match
      end
    end
  end
end`,

  GiftCardSelector: `
class GiftCardSelector < Selector
  def initialize(match_type)
    @invert = match_type == :not
  end

  def match?(line_item)
    @invert ^ line_item.variant.product.gift_card?
  end
end`,

  LineItemPriceSelector: `
class LineItemPriceSelector < Selector
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(line_item)
    case @comparison_type
      when :greater_than_equal
        line_item.variant.price >= @amount
      when :less_than_equal
        line_item.variant.price <= @amount
    end
  end
end`,

  LineItemPropertiesSelector: `
class LineItemPropertiesSelector < Selector
  def initialize(target_properties)
    @target_properties = target_properties
  end

  def match?(line_item)
    line_item_props = line_item.properties
    @target_properties.all? do |key, value|
      next unless line_item_props.has_key?(key)
      true if line_item_props[key].downcase == value.downcase
    end
  end
end`,

  LocaleQualifier: `
class LocaleQualifier < Qualifier
  def initialize(match_type, match_condition, locales)
    @match_condition = match_condition
    @invert = match_type == :does_not
    @locales = locales
  end

  def match?(_, _ = nil)
    locale = Input.locale.to_s
    if @match_condition === :match
      return @invert ^ @locales.include?(locale)
    else
      return @invert ^ partial_match(@match_condition, locale, @locales)
    end
  end
end`,

  NoCodeQualifier: `
class NoCodeQualifier < Qualifier
  def match?(cart, selector = nil)
    return true if cart.discount_code.nil?
    false
  end
end`,

  OrSelector: `
class OrSelector
  def initialize(*conditions)
    @conditions = conditions.compact
  end

  def match?(item, selector = nil)
    @conditions.any? do |condition|
      if selector
        condition.match?(item, selector)
      else
        condition.match?(item)
      end
    end
  end
end`,

  ProductIdSelector: `
class ProductIdSelector < Selector
  def initialize(match_type, product_ids)
    @invert = match_type == :not_one
    @product_ids = product_ids.map { |id| id.to_i }
  end

  def match?(line_item)
    @invert ^ @product_ids.include?(line_item.variant.product.id)
  end
end`,

  ProductTagSelector: `
class ProductTagSelector < Selector
  def initialize(match_type, match_condition, tags)
    @match_condition = match_condition
    @invert = match_type == :does_not
    @tags = tags.map(&:downcase)
  end

  def match?(line_item)
    product_tags = line_item.variant.product.tags.to_a.map(&:downcase)
    case @match_condition
      when :match
        return @invert ^ ((@tags & product_tags).length > 0)
      else
        return @invert ^ partial_match(@match_condition, product_tags, @tags)
    end
  end
end`,

  ProductTypeSelector: `
class ProductTypeSelector < Selector
  def initialize(match_type, product_types)
    @invert = match_type == :not_one
    @product_types = product_types.map(&:downcase)
  end

  def match?(line_item)
    @invert ^ @product_types.include?(line_item.variant.product.product_type.downcase)
  end
end`,

  ProductVendorSelector: `
class ProductVendorSelector < Selector
  def initialize(match_type, vendors)
    @invert = match_type != :is_one
    @vendors = vendors.map(&:downcase)
  end

  def match?(line_item)
    @invert ^ @vendors.include?(line_item.variant.product.vendor.downcase)
  end
end`,

  Qualifier: `
class Qualifier
  def partial_match(match_type, item_info, possible_matches)
    match_type = (match_type.to_s + '?').to_sym
    if item_info.kind_of?(Array)
      possible_matches.any? do |possibility|
        item_info.any? do |search|
          search.send(match_type, possibility)
        end
      end
    else
      possible_matches.any? do |possibility|
        item_info.send(match_type, possibility)
      end
    end
  end

  def compare_amounts(compare, comparison_type, compare_to)
    case comparison_type
      when :greater_than
        return compare > compare_to
      when :greater_than_or_equal
        return compare >= compare_to
      when :less_than
        return compare < compare_to
      when :less_than_or_equal
        return compare <= compare_to
      when :equal_to
        return compare == compare_to
      else
        raise "Invalid comparison type"
    end
  end
end`,

  ReducedCartAmountQualifier: `
class ReducedCartAmountQualifier < Qualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    total =
      case cart.discount_code
        when CartDiscount::Percentage
          if cart.subtotal_price >= cart.discount_code.minimum_order_amount
            cart_subtotal_without_gc = cart.line_items.reduce(Money.zero) do |total, item|
              total + (item.variant.product.gift_card? ? Money.zero : item.line_price)
            end
            gift_card_amount = cart.subtotal_price - cart_subtotal_without_gc
            cart_subtotal_without_gc * ((Decimal.new(100) - cart.discount_code.percentage) / 100) + gift_card_amount
          else
            cart.subtotal_price
          end
        when CartDiscount::FixedAmount
          if cart.subtotal_price >= cart.discount_code.minimum_order_amount
            [cart.subtotal_price - cart.discount_code.amount, Money.zero].max
          else
            cart.subtotal_price
          end
        else
          cart.subtotal_price
      end
    compare_amounts(total, @comparison_type, @amount)
  end
end`,

  ReducedItemSelector: `
class ReducedItemSelector < Selector
  def initialize(match_type)
    @invert = match_type == :not
  end

  def match?(line_item)
    @invert ^ line_item.discounted?
  end
end`,

  SaleItemSelector: `
class SaleItemSelector < Selector
  def initialize(match_type)
    @invert = match_type == :is
  end

  def match?(line_item)
    @invert ^ (line_item.variant.compare_at_price.nil? || line_item.variant.compare_at_price <= line_item.variant.price)
  end
end`,

  Selector: `
class Selector
  def partial_match(match_type, item_info, possible_matches)
    match_type = (match_type.to_s + '?').to_sym
    if item_info.kind_of?(Array)
      possible_matches.any? do |possibility|
        item_info.any? do |search|
          search.send(match_type, possibility)
        end
      end
    else
      possible_matches.any? do |possibility|
        item_info.send(match_type, possibility)
      end
    end
  end
end`,

  TotalWeightQualifier: `
class TotalWeightQualifier < Qualifier
  def initialize(comparison_type, amount, units)
    @comparison_type = comparison_type
    @amount = amount
    @units = units
  end

  def g_to_lb(grams)
    grams * 0.00220462
  end

  def g_to_oz(grams)
    grams * 0.035274
  end

  def g_to_kg(grams)
    grams * 0.001
  end

  def match?(cart, selector = nil)
    cart_weight = cart.total_weight
    case @units
      when :lb
        cart_weight = g_to_lb(cart_weight)
      when :kg
        cart_weight = g_to_kg(cart_weight)
      when :oz
        cart_weight = g_to_oz(cart_weight)
    end

    compare_amounts(cart_weight, @comparison_type, @amount)
  end
end`,

  VariantIdSelector: `
class VariantIdSelector < Selector
  def initialize(match_type, variant_ids)
    @invert = match_type == :not_one
    @variant_ids = variant_ids.map { |id| id.to_i }
  end

  def match?(line_item)
    @invert ^ @variant_ids.include?(line_item.variant.id)
  end
end`,

  VariantSkuSelector: `
class VariantSkuSelector < Selector
  def initialize(match_type, match_condition, skus)
    @invert = match_type == :does_not
    @match_condition = match_condition
    @skus = skus.map(&:downcase)
  end

  def match?(line_item)
    variant_skus = line_item.variant.skus.to_a.map(&:downcase)
    case @match_condition
      when :match
        return @invert ^ ((@skus & variant_skus).length > 0)
      else
        return @invert ^ partial_match(@match_condition, variant_skus, @skus)
    end
  end
end`,
};

const customerQualifiers = [{
    value: "none",
    label: "None",
    description: "No effects"
  },
  {
    value: "CustomerEmailQualifier",
    label: "Customer Email",
    description: "Qualifies cutomers based on email",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the following condition matches",
        options: [{
            value: "does",
            label: "Does"
          },
          {
            value: "does_not",
            label: "Does not"
          }
        ]
      },
      match_condition: {
        type: "select",
        description: "Set how the email is matched",
        options: [{
            value: "match",
            label: "Match one of"
          },
          {
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
            label: "Start with one of"
          },
          {
            value: "end_with",
            label: "End with one of"
          }
        ]
      },
      customer_emails: {
        type: "array",
        description: "Enter the applicable emails"
      }
    }
  },
  {
    value: "CustomerTagQualifier",
    label: "Customer Tags",
    description: "Qualifies customers based on tags",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the following condition matches",
        options: [{
            value: "does",
            label: "Does"
          },
          {
            value: "does_not",
            label: "Does not"
          }
        ]
      },
      match_condition: {
        type: "select",
        description: "Set how the tags are matched",
        options: [{
            value: "match",
            label: "Match one of"
          },
          {
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
            label: "Start with one of"
          },
          {
            value: "end_with",
            label: "End with one of"
          }
        ]
      },
      customer_tags: {
        type: "array",
        description: "Enter the applicable tags"
      }
    }
  },
  {
    value: "CustomerOrderCountQualifier",
    label: "Customer Order Count",
    description: "Qualifies customers based on the number of orders placed",
    inputs: {
      match_condition: {
        type: "select",
        description: "Type of comparison",
        options: [{
            value: "greater_than",
            label: "Greater than"
          },
          {
            value: "less_than",
            label: "Less than"
          },
          {
            value: "greater_than_or_equal",
            label: "Greater than or equal to"
          },
          {
            value: "less_than_or_equal",
            label: "Less than or equal to"
          },
        ]
      },
      orders: {
        type: "number",
        description: "Number of orders"
      }
    }
  },
  {
    value: "CustomerTotalSpentQualifier",
    label: "Customer Total Spent",
    description: "Qualifies customers based on the total amount spent",
    inputs: {
      match_condition: {
        type: "select",
        description: "Type of comparison",
        options: [{
            value: "greater_than",
            label: "Greater than"
          },
          {
            value: "less_than",
            label: "Less than"
          },
          {
            value: "greater_than_or_equal",
            label: "Greater than or equal to"
          },
          {
            value: "less_than_or_equal",
            label: "Less than or equal to"
          },
        ]
      },
      amount: {
        type: "number",
        description: "Amount in dollars"
      }
    }
  },
  {
    value: "CustomerAcceptsMarketingQualifier",
    label: "Customer Accepts Marketing",
    description: "Qualifies if the customer does or does not accept marketing",
    inputs: {
      qualifing_condition: {
        type: "select",
        description: "Set the condition that the customer qualifies",
        options: [{
            value: "does",
            label: "Does accept"
          },
          {
            value: "does_not",
            label: "Does not accept"
          }
        ]
      }
    }
  }
];

const lineItemSelectors = [{
    value: "none",
    label: "None",
    description: "Any item selected/No effect on qualifier"
  },
  {
    value: "ProductIdSelector",
    label: "Product ID",
    description: "Selects line items by product ID",
    inputs: {
      match_condition: {
        type: "select",
        description: "Set how product ID's are matched",
        options: [{
            value: "is_one",
            label: "Is one of"
          },
          {
            value: "not_one",
            label: "Is not one of"
          }
        ]
      },
      product_IDs: {
        type: "array",
        description: "Enter the applicable ID's"
      }
    }
  },
  {
    value: "ProductTypeSelector",
    label: "Product Type",
    description: "Selects line items by product type",
    inputs: {
      match_condition: {
        type: "select",
        description: "Set how product types are matched",
        options: [{
            value: "is_one",
            label: "Is one of"
          },
          {
            value: "not_one",
            label: "Is not one of"
          }
        ]
      },
      product_types: {
        type: "array",
        description: "Enter the applicable types"
      }
    }
  },
  {
    value: "ProductVendorSelector",
    label: "Product Vendor",
    description: "Selects line items by product vendor",
    inputs: {
      match_condition: {
        type: "select",
        description: "Set how product vendors are matched",
        options: [{
            value: "is_one",
            label: "Is one of"
          },
          {
            value: "not_one",
            label: "Is not one of"
          }
        ]
      },
      product_vendors: {
        type: "array",
        description: "Enter the applicable vendors"
      }
    }
  },
  {
    value: "ProductTagSelector",
    label: "Product Tag",
    description: "Selects line items by product tag",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the following condition matches",
        options: [{
            value: "does",
            label: "Does"
          },
          {
            value: "does_not",
            label: "Does not"
          }
        ]
      },
      match_condition: {
        type: "select",
        description: "Set how the tags are matched",
        options: [{
            value: "match",
            label: "Match one of"
          },
          {
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
            label: "Start with one of"
          },
          {
            value: "end_with",
            label: "End with one of"
          }
        ]
      },
      product_tags: {
        type: "array",
        description: "Enter the applicable tags"
      }
    }
  },
  {
    value: "VariantSkuSelector",
    label: "Variant SKU",
    description: "Selects line items by variant SKU",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the following condition matches",
        options: [{
            value: "does",
            label: "Does"
          },
          {
            value: "does_not",
            label: "Does not"
          }
        ]
      },
      match_condition: {
        type: "select",
        description: "Set how the skus are matched",
        options: [{
            value: "match",
            label: "Match one of"
          },
          {
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
            label: "Start with one of"
          },
          {
            value: "end_with",
            label: "End with one of"
          }
        ]
      },
      variant_skus: {
        type: "array",
        description: "Enter the applicable skus"
      }
    }
  },
  {
    value: "VariantIdSelector",
    label: "Variant ID",
    description: "Selects line items by variant ID",
    inputs: {
      match_condition: {
        type: "select",
        description: "Set how variant ID's are matched",
        options: [{
            value: "is_one",
            label: "Is one of"
          },
          {
            value: "not_one",
            label: "Is not one of"
          }
        ]
      },
      variant_IDs: {
        type: "array",
        description: "Enter the applicable ID's"
      }
    }
  },
  {
    value: "LineItemPropertiesSelector",
    label: "Has Properties",
    description: "Selects line items if they have specific properties",
    inputs: {
      keys_and_values: {
        type: "object",
        description: "Properties must match all entered key/value pairs",
        inputFormat: "{key:text:The property's key} : {value:text:The value of the property}",
        outputFormat: '"{text}" => "{text}"'
      }
    }
  },
  {
    value: "LineItemPriceSelector",
    label: "Item Price",
    description: "Selects line items if the variant price meets the condition",
    inputs: {
      match_condition: {
        type: "select",
        description: "Set how the amount is matched",
        options: [{
            value: "greater_than_equal",
            label: "Greater than or equal to"
          },
          {
            value: "less_than_equal",
            label: "Less than or equal to"
          }
        ]
      },
      amount: {
        type: "number",
        description: "Amount in dollars"
      }
    }
  },
  {
    value: "GiftCardSelector",
    label: "Gift Card Selector",
    description: "Selects line items if they are/are not a Gift Card",
    inputs: {
      match_condition: {
        type: "select",
        description: "Set how gift cards are matched",
        options: [{
            value: "is",
            label: "Is a Gift Card"
          },
          {
            value: "not",
            label: "Is not a Gift Card"
          }
        ]
      }
    }
  },
  {
    value: "SaleItemSelector",
    label: "Sale Item Selector",
    description: "Selects line items if they are/are not on sale",
    inputs: {
      match_condition: {
        type: "select",
        description: "Set how sale items are matched",
        options: [{
            value: "is",
            label: "Is on sale"
          },
          {
            value: "not",
            label: "Is not on sale"
          }
        ]
      }
    }
  },
  {
    value: "ReducedItemSelector",
    label: "Discounted Item Selector (discount by scripts)",
    description: "Selects line items if they have/have not been discounted by a script",
    inputs: {
      match_condition: {
        type: "select",
        description: "Set how discounted items are matched",
        options: [{
            value: "is",
            label: "Has been discounted"
          },
          {
            value: "not",
            label: "Has not been discounted"
          }
        ]
      }
    }
  }
]

const cartQualifiers = [{
    value: "none",
    label: "None",
    description: "No effects"
  },
  {
    value: "CartAmountQualifier",
    label: "Cart/Item subtotal",
    description: "Will only apply if the cart or item subtotals meet the conditions",
    inputs: {
      behaviour: {
        type: "select",
        description: "Comparison behaviour",
        options: [{
            value: "cart",
            label: "Cart current subtotal"
          },
          {
            value: "item",
            label: "Qualified item current subtotal"
          },
          {
            value: "diff_cart",
            label: "Difference from original cart subtotal (before script discounts)"
          },
          {
            value: "diff_item",
            label: "Difference from original qualified item subtotal (before script discounts)"
          },
        ]
      },
      condition: {
        type: "select",
        description: "Type of comparison",
        options: [{
            value: "greater_than",
            label: "Greater than"
          },
          {
            value: "less_than",
            label: "Less than"
          },
          {
            value: "greater_than_or_equal",
            label: "Greater than or equal to"
          },
          {
            value: "less_than_or_equal",
            label: "Less than or equal to"
          },
        ]
      },
      amount: {
        type: "number",
        description: "Amount in dollars"
      },
    }
  },
  {
    value: "CartQuantityQualifier",
    label: "Cart/Item/Line quantity",
    description: "Will only apply if cart quantity, qualified item quantity, or qualified line quantity meets conditions",
    inputs: {
      cart_or_item_total: {
        type: "select",
        description: "Cart quantity or item quantity",
        options: [{
            value: "cart",
            label: "Cart total quantity"
          },
          {
            value: "item",
            label: "Qualified item total quantity"
          },
          {
            value: "line_any",
            label: "Qualified items on any line"
          },
          {
            value: "line_all",
            label: "Qualified items on all lines"
          },
        ]
      },
      condition: {
        type: "select",
        description: "Type of comparison",
        options: [{
            value: "greater_than",
            label: "Greater than"
          },
          {
            value: "less_than",
            label: "Less than"
          },
          {
            value: "greater_than_or_equal",
            label: "Greater than or equal to"
          },
          {
            value: "less_than_or_equal",
            label: "Less than or equal to"
          },
          {
            value: "equal_to",
            label: "Equal to"
          },
        ]
      },
      amount: {
        type: "number",
        description: "Total quantity of items"
      }
    }
  },
  {
    value: "CartHasItemQualifier",
    label: "Cart Has Items",
    description: "Qualifies if the items in the cart match the given conditions",
    newLineEachInput: true,
    inputs: {
      quantity_or_subtotal: {
        type: "select",
        description: "Total quantity of items or subtotal of items",
        options: [{
            value: "quantity",
            label: "Item quantity"
          },
          {
            value: "subtotal",
            label: "Item subtotal"
          },
        ]
      },
      match_condition: {
        type: "select",
        description: "Type of comparison",
        options: [{
            value: "greater_than",
            label: "Greater than"
          },
          {
            value: "less_than",
            label: "Less than"
          },
          {
            value: "greater_than_or_equal",
            label: "Greater than or equal to"
          },
          {
            value: "less_than_or_equal",
            label: "Less than or equal to"
          },
        ]
      },
      amount: {
        type: "number",
        description: "Quantity or subtotal of items"
      },
      item_selector: lineItemSelectors,
    }
  },
  {
    value: "TotalWeightQualifier",
    label: "Cart Total Weight",
    description: "Qualifies cart based on total weight of products.",
    inputs: {
      match_condition: {
        type: "select",
        description: "Type of comparison",
        options: [{
            value: "greater_than",
            label: "Greater than"
          },
          {
            value: "less_than",
            label: "Less than"
          },
          {
            value: "greater_than_or_equal",
            label: "Greater than or equal to"
          },
          {
            value: "less_than_or_equal",
            label: "Less than or equal to"
          },
        ]
      },
      amount: {
        type: "number",
        description: "Weight to compare to"
      },
      units: {
        type: "select",
        description: "Units for weight",
        options: [{
            value: "g",
            label: "Grams (g)"
          },
          {
            value: "kg",
            label: "Kilograms (kg)"
          },
          {
            value: "oz",
            label: "Ounces (oz)"
          },
          {
            value: "lb",
            label: "Pounds (lb)"
          },
        ]
      }
    }
  },
  {
    value: "CodeQualifier",
    label: "Cart Has Discount Code",
    description: "Checks to see if the discount code entered matches conditions",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the following condition matches",
        options: [{
            value: "does",
            label: "Does"
          },
          {
            value: "does_not",
            label: "Does not"
          }
        ]
      },
      match_condition: {
        type: 'select',
        description: "Set how the discount code is matched",
        options: [{
            value: "match",
            label: "Match one of"
          },
          {
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
            label: "Start with one of"
          },
          {
            value: "end_with",
            label: "End with one of"
          }
        ]
      },
      discount_codes: {
        type: "array",
        description: "Enter the applicable codes"
      }
    }
  },
  {
    value: "NoCodeQualifier",
    label: "Cart Has No Discount Code",
    description: "Checks if there is no discount code present",
  },
  {
    value: "CountryAndProvinceQualifier",
    label: "Shipping Address - Country/Province Qualifier",
    description: "Qualifies the cart based on specific country and province codes (Two letters)",
    newLineEachInput: true,
    inputs: {
      match_condition: {
        type: "select",
        description: "Set how the following countries/provinces are matched",
        options: [{
            value: "is_one",
            label: "Is one of"
          },
          {
            value: "not_one",
            label: "Is not one of"
          }
        ]
      },
      countries_and_provinces: {
        type: "object",
        description: "Country codes and the provice/state codes to match",
        inputFormat: "{country:text:The country code}: {provinces:array:The provinces included. Seperate each with a comma. (AB, SK, MB)}",
        outputFormat: '"{text}" => [{array}]'
      }
    }
  },
  {
    value: "CountryCodeQualifier",
    label: "Shipping Address - Country Code Qualifier",
    description: "Qualifies the cart based on the country code of the shipping addresss (Two letters)",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the country codes are matched",
        options: [{
            value: "is_one",
            label: "Is one of"
          },
          {
            value: "not_one",
            label: "Is not one of"
          }
        ]
      },
      country_codes: {
        type: "array",
        description: "Enter the applicable country codes"
      }
    }
  },
  {
    value: "FullAddressQualifier",
    label: "Shipping Address - Full Address Qualifier - NEW",
    description: "Only qualifies if the shipping address matches one of the given addresses",
    inputs: {
      qualifing_addresses: {
        type: "objectArray",
        description: "Set the addresses that qualify",
        inputFormat: "{address1?:array:Add multiple options by separating each with a comma} : {address2?:array:Add multiple options by separating each with a comma} : {phone?:array:Add multiple options by separating each with a comma} : {city?:array:Add multiple options by separating each with a comma} : {province_code?:array:Add multiple options by separating each with a comma} : {country_code?:array:Add multiple options by separating each with a comma} : {zip?:array:Add multiple options by separating each with a comma} : {match_type:select:Type of match required (e.g. '150 Elgin' partially matches '150 Elgin St'):partial|Partial,exact|Exact}",
        outputFormat: '{:address1 => [{array}], :address2 => [{array}], :phone => [{array}], :city => [{array}], :province_code => [{array}], :country_code => [{array}], :zip => [{array}], :match_type => "{select}"}'
      }
    }
  },
  {
    value: "ReducedCartAmountQualifier",
    label: "Discounted Cart Subtotal (applied by discount code)",
    description: "Will only apply if the cart subtotal, subtracting cart discounts, meets conditions. NOTE: Works for discount codes that apply to entire cart only.",
    inputs: {
      condition: {
        type: "select",
        description: "Type of comparison",
        options: [{
            value: "greater_than",
            label: "Greater than"
          },
          {
            value: "less_than",
            label: "Less than"
          },
          {
            value: "greater_than_or_equal",
            label: "Greater than or equal to"
          },
          {
            value: "less_than_or_equal",
            label: "Less than or equal to"
          },
        ]
      },
      amount: {
        type: "number",
        description: "Amount in dollars"
      }
    }
  },
  {
    value: "LocaleQualifier",
    label: "Cart Locale Qualifier",
    description: "Will only apply if the cart locale matches the conditions",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the following condition matches",
        options: [{
            value: "does",
            label: "Does"
          },
          {
            value: "does_not",
            label: "Does not"
          }
        ]
      },
      condition: {
        type: "select",
        description: "Type of comparison",
        options: [{
            value: "match",
            label: "Match one of"
          },
          {
            value: "start_with",
            label: "Start with one of"
          },
          {
            value: "end_with",
            label: "End with one of"
          },
        ]
      },
      locales: {
        type: "array",
        description: "Enter the applicable locales"
      }
    }
  },
];

export default {
  classes,
  customerQualifiers,
  cartQualifiers,
  lineItemSelectors
}
