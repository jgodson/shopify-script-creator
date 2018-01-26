import Common from './common';

const classes = {
  PostCartAmountQualifier: `
class PostCartAmountQualifier < Qualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type == :default ? :greater_than : comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    total = cart.subtotal_price
    compare_amounts(total, @comparison_type, @amount)
  end
end`,

  PercentageDiscount: `
class PercentageDiscount
  def initialize(percent, message)
    @discount = (100 - percent) / 100.0
    @message = message
  end

  def apply(line_item)
    line_item.change_line_price(line_item.line_price * @discount, message: @message)
  end
end`,

  FixedTotalDiscount: `
class FixedTotalDiscount
  def initialize(amount, message)
    @amount = Money.new(cents: amount * 100)
    @message = message
    @discount_applied = Money.zero
  end

  def apply(line_item)
    return unless @discount_applied < @amount
    discount_to_apply = [(@amount - @discount_applied), line_item.line_price].min
    line_item.change_line_price(line_item.line_price - discount_to_apply, {message: @message})
    @discount_applied += discount_to_apply
  end
end`,

  FixedItemDiscount: `
class FixedItemDiscount
  def initialize(amount, message)
    @amount = Money.new(cents: amount * 100)
    @message = message
  end

  def apply(line_item)
    per_item_price = line_item.variant.price
    per_item_discount = [(@amount - per_item_price), @amount].max
    discount_to_apply = [(per_item_discount * line_item.quantity), line_item.line_price].min
    line_item.change_line_price(line_item.line_price - discount_to_apply, {message: @message})
  end
end`,

  TaxDiscount: `
class TaxDiscount
  def initialize(amount, message)
    @amount = amount
    @message = message
  end

  def apply(line_item)
    calculated_tax_fraction = @amount / (100 + @amount)
    item_tax = line_item.variant.price * calculated_tax_fraction
    per_item_price = line_item.variant.price - item_tax
    new_line_price = per_item_price * line_item.quantity
    line_item.change_line_price(new_line_price, message: @message)
  end
end`,

  ExcludeDiscountCodes: `
class ExcludeDiscountCodes < Qualifier
  def initialize(behaviour, message)
    @reject = behaviour == :apply_script
    @message = message == "" ? "Discount codes cannot be used with this offer" : message
  end
  
  def match?(cart, selector = nil)
    cart.discount_code.nil? || @reject && cart.discount_code.reject({message: @message})
  end
end`,

  ConditionalDiscount: `
class ConditionalDiscount < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, discount, max_discounts)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = line_item_selector
    @discount = discount
    @items_to_discount = max_discounts == 0 ? nil : max_discounts
  end

  def run(cart)
    raise "Campaign requires a discount" unless @discount
    return unless qualifies?(cart)
    applicable_items = cart.line_items.select { |item| @line_item_selector.nil? || @line_item_selector.match?(item) }
    applicable_items = applicable_items.sort_by { |item| item.variant.price }
    applicable_items.each do |item|
      break if @items_to_discount == 0
      if (!@items_to_discount.nil? && item.quantity > @items_to_discount)
        discounted_items = item.split(take: @items_to_discount)
        @discount.apply(discounted_items)
        cart.line_items << discounted_items
        @items_to_discount = 0
      else
        @discount.apply(item)
        @items_to_discount -= item.quantity if !@items_to_discount.nil?
      end
    end
    revert_changes(cart) unless @post_amount_qualifier.nil? || @post_amount_qualifier.match?(cart)
  end
end`,

  RejectAllDiscountCodes: `
class RejectAllDiscountCodes < Campaign
  def initialize(message)
    @message = message == "" ? "Discount codes are disabled" : message
  end

  def run(cart)
    cart.discount_code.reject({message: @message}) unless cart.discount_code.nil?
  end
end`,

  BuyXGetX: `
class BuyXGetX < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, buy_item_selector, get_item_selector, discount, buy_x, get_x, max_sets)
    raise "buy_x must be greater than or equal to get_x" unless buy_x >= get_x

    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = buy_item_selector
    @get_item_selector = get_item_selector
    @discount = discount
    @buy_x = buy_x + get_x
    @get_x = get_x
    @max_sets = max_sets == 0 ? nil : max_sets
  end
  
  def run(cart)
    raise "Campaign requires a discount" unless @discount
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
    discountable_sets = @max_sets ? [purchased_quantity / @buy_x, @max_sets].min : purchased_quantity / @buy_x
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
    revert_changes(cart) unless @post_amount_qualifier.nil? || @post_amount_qualifier.match?(cart)
  end
end`,

  ConditionalDiscountCodeRejection: `
class ConditionalDiscountCodeRejection < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, li_match_type, line_item_qualifier, message)
    super(condition, customer_qualifier, cart_qualifier, line_item_qualifier)
    @li_match_type = li_match_type == :default ? :any? : (li_match_type.to_s + '?').to_sym
    @message = message == "" ? "Discount codes are disabled" : message
  end

  def run(cart)
    return unless cart.discount_code
    cart.discount_code.reject({message: @message}) unless qualifies?(cart)
  end
end`,

  QuantityLimit: `
class QuantityLimit < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, limit_by, limit)
    super(condition, customer_qualifier, cart_qualifier)
    @limit_by = limit_by == :default ? :product : limit_by
    @line_item_selector = line_item_selector
    @per_item_limit = limit
  end

  def run(cart)
    return unless qualifies?(cart)
    item_limits = {}
    to_delete = []
    if @per_item_limit == 0
      cart.line_items.delete_if { |item| @line_item_selector.nil? || @line_item_selector.match?(item) }
    else
      cart.line_items.each_with_index do |item, index|
        next unless @line_item_selector.nil? || @line_item_selector.match?(item)
        key = nil
        case @limit_by
          when :product
            key = item.variant.product.id
          when :variant
            key = item.variant.id
        end
        
        if key
          item_limits[key] = @per_item_limit if !item_limits.has_key?(key)
          needs_limiting = true if item.quantity > item_limits[key]
          needs_deleted = true if item_limits[key] <= 0
          max_amount = item.quantity - item_limits[key]
          item_limits[key] -= needs_limiting ? max_amount : item.quantity
        else
          needs_limiting = true if item.quantity > @per_item_limit
          max_amount = item.quantity - @per_item_limit
        end
        
        if needs_limiting
          if needs_deleted
            to_delete << index
          else
            item.split(take: max_amount)
          end
        end
      end
      
      if to_delete.length > 0
        del_index = -1
        cart.line_items.delete_if do |item|
          del_index += 1
          true if to_delete.include?(del_index)
        end
      end
      
    end
    revert_changes(cart) unless @post_amount_qualifier.nil? || @post_amount_qualifier.match?(cart)
  end
end`,

  TieredDiscount: `
class TieredDiscount < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, discount_type, tier_type, discount_tiers)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = line_item_selector
    @discount_type = discount_type
    @tier_type = tier_type == :default ? :customer_tag : tier_type
    @discount_tiers = discount_tiers.sort_by {|tier| tier[:discount] }
  end
  
  def init_discount(amount, message)
    if @discount_type == :fixed
      return FixedTotalDiscount.new(amount, message)
    else
      return PercentageDiscount.new(amount, message)
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
        discountable_total = applicable_items.reduce(Money.zero) { |total, item| total += item.line_price }
        qualified_tiers = @discount_tiers.select { |tier| discountable_total >= Money.new(cents: tier[:tier].to_i * 100) }
    end

    return if qualified_tiers.empty?
    discount_amount = qualified_tiers.last[:discount].to_i
    discount_message = qualified_tiers.last[:message]
    
    discount = init_discount(discount_amount, discount_message)
    applicable_items.each { |item| discount.apply(item) }
    revert_changes(cart) unless @post_amount_qualifier.nil? || @post_amount_qualifier.match?(cart)
  end
end`,

  DiscountCodeList: `
class DiscountCodeList < Campaign
  def initialize(condition, customer_qualifier, cart_qualifier, line_item_selector, discount_list)
    super(condition, customer_qualifier, cart_qualifier)
    @line_item_selector = line_item_selector
    @discount_list = discount_list
  end

  def init_discount(type, amount, message)
    if type == :fixed
      return FixedTotalDiscount.new(amount, message)
    else
      return PercentageDiscount.new(amount, message)
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
      when 'c', 'code'
        discount_type = get_discount_code_type(cart.discount_code)
    end
    return if discount_type.nil?

    discount = init_discount(discount_type, applicable_discount[:amount].to_i, applied_code)

    cart.line_items.each do |item|
      next unless @line_item_selector.nil? || @line_item_selector.match?(item)
      discount.apply(item)
    end
    revert_changes(cart) unless @post_amount_qualifier.nil? || @post_amount_qualifier.match?(cart)
  end
end`,

  DiscountCodePattern: `
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
    return type == :fixed ? FixedTotalDiscount.new(discount_amount, code) : PercentageDiscount.new(discount_amount, code)
  end

  def run(cart)
    return unless cart.discount_code
    return unless qualifies?(cart)
    
    discount = initialize_discount(cart.discount_code.code)
    return unless discount
    
    cart.line_items.each do |item|
      next unless @line_item_selector.nil? || @line_item_selector.match?(item)
      discount.apply(item)
    end
    revert_changes(cart) unless @post_amount_qualifier.nil? || @post_amount_qualifier.match?(cart)
  end
end`
};

const defaultCode = `
CAMPAIGNS = [
|
].freeze

CAMPAIGNS.each do |campaign|
  campaign.run(Input.cart)
end

Output.cart = Input.cart`;

const CUSTOMER_QUALIFIERS = [
  ...Common.customerQualifiers
];

const CART_QUALIFIERS = [
  ...Common.cartQualifiers,
  {
    value: "PostCartAmountQualifier",
    label: "Discounted Cart Subtotal (applied by scripts)",
    description: "Will only apply if the cart subtotal, after applying the campaign, meets conditions",
    inputs: {
      condition: {
        type: "select",
        description: "Type of comparison",
        options: [
          {
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
    value: "ExcludeDiscountCodes",
    label: "Cart Has No Discount Codes",
    description: "Do not allow discount codes and script discount to combine",
    inputs: {
      behaviour: {
        type: "select",
        description: "Set the behaviour when a discount code is entered",
        options: [
          {
            value: "apply_discount",
            label: "Apply discount code only"
          },
          {
            value: "apply_script",
            label: "Reject discount code and apply script"
          }
        ]
      },
      rejection_message: {
        type: "text",
        description: "Message to display to customer when code is rejected"
      }
    }
  }
];

const LINE_ITEM_SELECTORS = [
  ...Common.lineItemSelectors
];

const DISCOUNTS = [
  {
    value: "none",
    label: "None",
    description: "No discount"
  },
  {
    value: "PercentageDiscount",
    label: "Percentage Discount",
    description: "Discounts each selected line item by a percentage",
    inputs: {
      percent: {
        type: "number",
        description: "Percent discount to apply"
      },
      message: {
        type: "text",
        description: "Message to display to customer"
      }
    }
  },
  {
    value: "FixedTotalDiscount",
    label: "Fixed Total Discount",
    description: "Discounts selected items up to a maximum",
    inputs: {
      amount: {
        type: "number",
        description: "Maximum discount to apply"
      },
      message: {
        type: "text",
        description: "Message to display to customer"
      }
    }
  },
  {
    value: "FixedItemDiscount",
    label: "Fixed Per Item Discount",
    description: "Discounts each selected item by this amount",
    inputs: {
      amount: {
        type: "number",
        description: "Per Item discount to apply"
      },
      message: {
        type: "text",
        description: "Message to display to customer"
      }
    }
  },
  {
    value: "TaxDiscount",
    label: "Tax Discount",
    description: "Removes tax from the item price (to be used when tax is included in the price, but not applicable to the customer)",
    inputs: {
      tax_amount: {
        type: "number",
        description: "Percentage of tax included in the price"
      },
      message: {
        type: "text",
        description: "Message to display to customer"
      }
    }
  }
];

const CUSTOMER_AND_SELECTOR = {
  value: "AndSelector",
  label: "Multi-Select - Meets all conditions",
  description: "Qualifies if all of the following conditions are met",
  inputs: {
    customer_qualifier_1: [...CUSTOMER_QUALIFIERS],
    and_customer_qualifier_2: [...CUSTOMER_QUALIFIERS],
    and_customer_qualifier_3: [...CUSTOMER_QUALIFIERS],
  }
};

const CUSTOMER_OR_SELECTOR = {
  value: "OrSelector",
  label: "Multi-Select - Meets any conditions",
  description: "Qualifies if any of the following conditions are met",
  inputs: {
    customer_qualifier_1: [...CUSTOMER_QUALIFIERS],
    or_customer_qualifier_2: [...CUSTOMER_QUALIFIERS],
    or_customer_qualifier_3: [...CUSTOMER_QUALIFIERS]
  }
};

const LINE_ITEM_AND_SELECTOR = {
  value: "AndSelector",
  label: "Multi-Select - Meets all conditions",
  description: "Selected if all of the following conditions are met",
  inputs: {
    line_item_selector_1: [...LINE_ITEM_SELECTORS],
    and_line_item_selector_2: [...LINE_ITEM_SELECTORS],
    and_line_item_selector_3: [...LINE_ITEM_SELECTORS],
  }
};

const LINE_ITEM_OR_SELECTOR = {
  value: "OrSelector",
  label: "Multi-Select - Meets any conditions",
  description: "Selected if any of the following conditions are met",
  inputs: {
    line_item_selector_1: [...LINE_ITEM_SELECTORS],
    or_line_item_selector_2: [...LINE_ITEM_SELECTORS],
    or_line_item_selector_3: [...LINE_ITEM_SELECTORS]
  }
};

const CART_OR_SELECTOR = {
  value: "OrSelector",
  label: "Multi-Select - Meets any conditions",
  description: "Qualifies if any of the following conditions are met",
  inputs: {
    cart_qualifier_1: [...CART_QUALIFIERS],
    or_cart_qualifier_2: [...CART_QUALIFIERS],
    or_cart_qualifier_3: [...CART_QUALIFIERS]
  }
};

const CART_AND_SELECTOR = {
  value: "AndSelector",
  label: "Multi-Select - Meets all conditions",
  description: "Qualifies if all of the following conditions are met",
  inputs: {
    cart_qualifier_1: [...CART_QUALIFIERS],
    and_cart_qualifier_2: [...CART_QUALIFIERS],
    and_cart_qualifier_3: [...CART_QUALIFIERS]
  }
};


const campaigns = [
  {
    value: "ConditionalDiscount",
    label: "Conditional Discount",
    description: "Specify conditions to apply a discount",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Discount if all qualify"
          },
          {
            value: "any",
            label: "Discount if any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      discounted_item_selector: [...LINE_ITEM_SELECTORS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      discount_to_apply: [...DISCOUNTS],
      maximum_discounts: {
        type: "number",
        description: "Maximum number of items to discount, 0 for no limit."
      }
    }
  },
  {
    value: "BuyXGetX",
    label: "Buy X Get X Discounted",
    description: "Buy a certain number of items to receive discounted items",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Discount if all qualify"
          },
          {
            value: "any",
            label: "Discount if any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      buy_item_selector: [...LINE_ITEM_SELECTORS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      get_item_selector: [...LINE_ITEM_SELECTORS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      discount_to_apply: [...DISCOUNTS],
      buy_number: {
        type: "number",
        description: "Number of items to buy before qualifying for discount"
      },
      get_number: {
        type: "number",
        description: "Number of items to get when qualified for discount"
      },
      maximum_sets: {
        type: "number",
        description: "Maximum number of item sets to discount, 0 for no limit (Buy 2 Get 1 = 1 set)"
      }
    }
  },
  {
    value: "RejectAllDiscountCodes",
    label: "Reject All Discount Codes",
    description: "Rejects discount codes with a custom message",
    inputs: {
      message: {
        type: "text",
        description: "Message to display to customer when code is rejected"
      }
    }
  },
  {
    value: "ConditionalDiscountCodeRejection",
    label: "Conditionally Reject Discount Code",
    description: "Rejects discount codes based on conditions",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Reject code if all qualify"
          },
          {
            value: "any",
            label: "Reject code if any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      line_item_qualify_condition: {
        type: "select",
        description: "Set how line items are qualified",
        options: [
          {
            value: "any",
            label: "Qualify if any item in cart matches"
          },
          {
            value: "all",
            label: "Qualify if all items in cart match"
          }
        ]
      },
      line_item_qualifier: [...LINE_ITEM_SELECTORS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      message: {
        type: "text",
        description: "Message to display to customer when code is rejected"
      }
    }
  },
  {
    value: "QuantityLimit",
    label: "Quantity Limit",
    description: "Limit purchasable quantities for items if qualifiers do not match",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Limit unless all qualify"
          },
          {
            value: "any",
            label: "Limit unless any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      items_to_limit_selector: [...LINE_ITEM_SELECTORS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      limit_by: {
        type: "select",
        description: "Sets how items are limited",
        options: [
          {
            value: "product",
            label: "Limit by product - Maximum amount of each matching product can be purchased"
          },
          {
            value: "variant",
            label: "Limit by variant - Maximum amount of each matching variant of a product can be purchased"
          }
        ]
      },
      maximum_amount: {
        type: "number",
        description: "Maximum number of items permitted, 0 will not allow customer to purchase"
      }
    }
  },
  {
    value: "TieredDiscount",
    label: "Tiered Discount",
    description: "Apply different discounts based on specified conditons",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Discount if all qualify"
          },
          {
            value: "any",
            label: "Discount if any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      dicountable_items_selector: [...LINE_ITEM_SELECTORS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      discount_type: {
        type: "select",
        description: "Discount selected items by the tier amount as a percent or a total fixed amount",
        options: [
          {
            value: "percent",
            label: "Percentage Discount"
          },
          {
            value: "fixed",
            label: "Fixed Total Discount"
          }
        ]
      },
      tier_type: {
        type: "select",
        description: "Set what the discount tiers are based on",
        options: [
          {
            value: "customer_tag",
            label: "Customer Tag"
          },
          {
            value: "cart_subtotal",
            label: "Cart Subtotal"
          },
          {
            value: "discountable_total",
            label: "Discountable Items Total"
          }
        ]
      },
      discount_tiers: {
        type: "objectArray",
        description: "Each tier should be on a new line. Format: (tier : discount_amount : discount_message)",
        inputFormat: "{tier:text} : {discount:text} : {message:text}",
        outputFormat: '{:tier => "{text}", :discount => "{text}", :message => "{text}"}'
      }
    },
    dependants: ["PercentageDiscount", "FixedTotalDiscount"]
  },
  {
    value: "DiscountCodeList",
    label: "Discount Code List",
    description: "Apply different discounts based on discount code entered",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Discount if all qualify"
          },
          {
            value: "any",
            label: "Discount if any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      dicountable_items_selector: [...LINE_ITEM_SELECTORS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      discounts: {
        type: "objectArray",
        description: "Each discount should be on a new line. Format: (discount_code : discount_type((f)ixed/(p)ercent/(c)ode) : discount_amount)",
        inputFormat: "{code:text} : {type:text} : {amount:text}",
        outputFormat: '{:code => "{text}", :type => "{text}", :amount => "{text}"}'
      }
    },
    dependants: ["PercentageDiscount", "FixedTotalDiscount"]
  },
  {
    value: "DiscountCodePattern",
    label: "Discount Code Pattern Discount",
    description: "Apply different discounts based on a pattern in a discount code",
    inputs: {
      qualifer_behaviour: {
        type: "select",
        description: "Set the qualifier behaviour",
        options: [
          {
            value: "all",
            label: "Discount if all qualify"
          },
          {
            value: "any",
            label: "Discount if any qualify"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      dicountable_items_selector: [...LINE_ITEM_SELECTORS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      percent_pattern: {
        type: "text",
        description: "Percentage discount pattern (# = will always be a number PD## = PD10ABCDE for 10% discount)"
      },
      fixed_pattern: {
        type: "text",
        description: "Fixed discount pattern (# = will always be a number FD### = ABCFD075EF for $75 total discount)"
      }
    },
    dependants: ["PercentageDiscount", "FixedTotalDiscount"]
  }
];

export default {
  classes,
  defaultCode,
  campaigns
};