import Common from './common';

const classes = {
  ExcludeGiftCards: `
class ExcludeGiftCards
  def match?(line_item)
    !line_item.variant.product.gift_card?
  end
end`,

  ExcludeSaleItems: `
class ExcludeSaleItems
  def match?(line_item)
    line_item.variant.compare_at_price.nil? || line_item.variant.compare_at_price <= line_item.variant.price
  end
end`,

  ExcludeReducedItems: `
class ExcludeReducedItems
  def match?(line_item)
    !line_item.discounted?
  end
end`,

  PercentageDiscount: `
class PercentageDiscount
  def initialize(percent, message)
    @percent = Decimal.new(percent) / 100.0
    @message = message
  end

  def apply(line_item)
    line_discount = line_item.line_price * @percent
    new_line_price = line_item.line_price - line_discount
    line_item.change_line_price(new_line_price, message: @message)
  end
end`,

  FixedDiscount: `
class FixedDiscount
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

  ExcludeDiscountCodes: `
class ExcludeDiscountCodes
  def initialize(behaviour, message)
    @reject = behaviour == :apply_script
    @message = message == "" ? "Discount codes cannot be used with this offer" : message
  end
  
  def match?(cart)
    cart.discount_code.nil? || @reject && cart.discount_code.reject({message: @message})
  end
end`,

  ConditionalDiscount: `
class ConditionalDiscount
  def initialize(customer_qualifier, cart_qualifier, line_item_qualifier, discount, max_discounts)
    @customer_qualifier = customer_qualifier
    @cart_qualifier = cart_qualifier
    @line_item_qualifier = line_item_qualifier
    @discount = discount
    @items_to_discount = max_discounts == 0 ? nil : max_discounts
  end

  def run(cart)
    return unless @discount
    return unless @customer_qualifier.nil? || @customer_qualifier.match?(cart)
    return unless @cart_qualifier.nil? || @cart_qualifier.match?(cart)
    applicable_items = cart.line_items.select { |item| @line_item_qualifier.nil? || @line_item_qualifier.match?(item) }
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
  end
end`,

  RejectAllDiscountCodes: `
class RejectAllDiscountCodes
  def initialize(message)
    @message = message == "" ? "Discount codes are disabled" : message
  end

  def run(cart)
    if cart.discount_code
      cart.discount_code.reject({message: @message})
    end
  end
end`,

  BuyXGetX: `
class BuyXGetX
  def initialize(customer_qualifier, cart_qualifier, buy_item_qualifier, get_item_qualifier, discount, buy_x, get_x, max_sets)
    raise "buy_x must be greater than or equal to get_x" unless buy_x >= get_x
    
    @customer_qualifier = customer_qualifier
    @cart_qualifier = cart_qualifier
    @buy_item_qualifier = buy_item_qualifier
    @get_item_qualifier = get_item_qualifier
    @discount = discount
    @buy_x = buy_x + get_x
    @get_x = get_x
    @max_sets = max_sets == 0 ? nil : max_sets
  end
  
  def run(cart)
    return unless @discount
    return unless @customer_qualifier.nil? || @customer_qualifier.match?(cart)
    return unless @cart_qualifier.nil? || @cart_qualifier.match?(cart)
    return unless cart.line_items.reduce(0) {|total, item| total += item.quantity } >= @buy_x
    applicable_buy_items = nil
    eligible_get_items = nil
    discountable_sets = 0
    
    # Find the items that qualify for buy_x
    if @buy_item_qualifier.nil?
      applicable_buy_items = cart.line_items
    else
      applicable_buy_items = cart.line_items.select { |item| @buy_item_qualifier.match?(item) }
    end
    
    # Find the items that qualify for get_x
    if @get_item_qualifier.nil?
      eligible_get_items = cart.line_items
    else
      eligible_get_items = cart.line_items.select {|item| @get_item_qualifier.match?(item) }
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
  end
end`,

  ConditionalDiscountCodeRejection: `
class ConditionalDiscountCodeRejection
  def initialize(match_type, customer_qualifier, cart_qualifier, line_item_selector, message)
    @invert = match_type == :no_match
    @cart_qualifier = cart_qualifier
    @line_item_selector = line_item_selector
    @message = message == "" ? "Discount codes are disabled" : message
  end

  def run(cart)
    return unless cart.discount_code
    return unless @customer_qualifier.nil? || (@invert ^ @customer_qualifier.match?(cart))
    return unless @cart_qualifier.nil? || (@invert ^ @cart_qualifier.match?(cart))
    return unless @line_item_selector.nil? || @invert ^ cart.line_items.any? do |item|
      @line_item_selector.match?(item)
    end
    cart.discount_code.reject({message: @message})
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
  ...Common.customer_qualifiers
];

const CART_QUALIFIERS = [
  ...Common.cart_qualifiers,
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

const LINE_ITEM_QUALIFIERS = [
  ...Common.line_item_qualifiers,
  {
    value: "ExcludeGiftCards",
    label: "Not a Gift Card",
    description: "Do not match products that are gift cards"
  },
  {
    value: "ExcludeSaleItems",
    label: "Not on sale",
    description: "Do not match products that are on sale (price is less than compare at price)"
  },
  {
    value: "ExcludeReducedItems",
    label: "Not previously discounted (via script)",
    description: "Do not match products that were already discounted via scripts"
  }
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
    description: "Discounts the line item by a percentage",
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
    value: "FixedDiscount",
    label: "Fixed Discount",
    description: "Splits the given amount between qualified items",
    inputs: {
      amount: {
        type: "number",
        description: "Total discount to apply"
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
    line_item_selector_1: [...LINE_ITEM_QUALIFIERS],
    and_line_item_selector_2: [...LINE_ITEM_QUALIFIERS],
    and_line_item_selector_3: [...LINE_ITEM_QUALIFIERS],
  }
};

const LINE_ITEM_OR_SELECTOR = {
  value: "OrSelector",
  label: "Multi-Select - Meets any conditions",
  description: "Selected if any of the following conditions are met",
  inputs: {
    line_item_selector_1: [...LINE_ITEM_QUALIFIERS],
    or_line_item_selector_2: [...LINE_ITEM_QUALIFIERS],
    or_line_item_selector_3: [...LINE_ITEM_QUALIFIERS]
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
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      discounted_item_selector: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
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
    description: "Buy a certain number of items to receive discouted items",
    inputs: {
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      buy_item_selector: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      get_item_selector: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
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
      match_condition: {
        type: "select",
        description: "Sets the type of match needed to reject the code",
        options: [
          {
            value: "match",
            label: "Reject if any match"
          },
          {
            value: "no_match",
            label: "Reject if none match"
          }
        ]
      },
      customer_qualifier: [...CUSTOMER_QUALIFIERS, CUSTOMER_AND_SELECTOR, CUSTOMER_OR_SELECTOR],
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      message: {
        type: "text",
        description: "Message to display to customer when code is rejected"
      }
    }
  }
];

export default {
  classes,
  defaultCode,
  campaigns
};