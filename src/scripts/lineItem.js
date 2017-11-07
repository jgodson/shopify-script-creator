const classes = `\
# Combines selectors together and returns true if they all match
class AndSelector
  def initialize(*selectors)
    @selectors = selectors
  end

  def match?(item)
    @selectors.all? { |selector| 
    selector.match?(item) }
  end
end

# Combines selectors together and returns true if any of them match
class OrSelector
  def initialize(*selectors)
    @selectors = selectors
  end

  def match?(item)
    @selectors.any? { |selector| selector.match?(item) }
  end
end

# Checks to see if the product is a gift card, returns true if it is
class ExcludeGiftCardSelector
  def match?(line_item)
    !line_item.variant.product.gift_card?
  end
end

# Applies a given percentage discount to an item with the given message
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
end

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
end

class ProductsSelector
  def initialize(product_ids)
    @product_ids = product_ids
  end

  def match?(line_item)
    @product_ids.include?(line_item.variant.product.id)
  end
end

# Ensures the cart amount meets a certain criteria
class CartAmountQualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart)
    total = cart.subtotal_price
    case @comparison_type
      when :greater_than
        return total > @amount
      when :greater_than_or_equal
        return total >= @amount
      when :less_than
        return total < @amount
      when :less_than_or_equal
        return total <= @amount
      else
        raise "Invalid comparison type"
    end
  end
end

# Checks to see if the cart has no discount codes. Optionally can reject the discount code with a message
class ExcludeDiscountCodes
  def initialize(reject, message)
    @reject = reject
    @message = message
  end
  
  def match?(cart)
    cart.discount_code.nil? || @reject && cart.discount_code.reject({message: @message})
  end
end

class DiscountUsingSelector
  def initialize(cart_qualifier, line_item_qualifier, discount)
    @cart_qualifier = cart_qualifier
    @line_item_qualifier = line_item_qualifier
    @discount = discount
  end

  def run(cart)
    return unless @cart_qualifier.nil? || @cart_qualifier.match?(cart)
    cart.line_items.each do |item|
      next unless @line_item_qualifier.nil? || @line_item_qualifier.match?(item)
      @discount.apply(item)
    end
  end
end
`;

const defaultCode = `
CAMPAIGNS = [|].freeze

CAMPAIGNS.each do |campaign|
  campaign.run(Input.cart)
end

Output.cart = Input.cart`;

const CART_QUALIFIERS = [
  {
    value: "none",
    label: "None",
    description: "Applies to any cart"
  },
  {
    value: "CartAmountQualifier",
    label: "Cart Amount Qualifier",
    description: "Will only apply if cart subtotal meets conditions",
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
    label: "Exclude Discount Codes",
    description: "Will only apply if no discount codes are used. Optionally can reject the discount code with a message",
    inputs: {
      reject_discount_code: {
        type: "boolean",
        description: "If checked, script will apply. If unchecked, script will not apply",
      },
      rejection_message: {
        type: "text",
        description: "Will be shown to the customer if discount code was rejected"
      }
    }
  }
]

const LINE_ITEM_QUALIFIERS = [
  {
    value: "none",
    label: "None",
    description: "Applies to any line item"
  },
  {
    value: "ProductIdSelector",
    label: "Product ID Selector",
    description: "Selects line items by product ID",
    inputs: {
      product_ids: {
        type: "array",
        description: "Seperate individual product ID's with a comma (,)"
      }
    }
  },
  {
    value: "ProductTagSelector",
    label: "Product Tag Selector",
    description: "Selects line items by product tag",
    inputs: {
      tags: {
        type: "array",
        description: "Seperate individual tags with a comma (,)"
      }
    }
  }
]

const DISCOUNTS = [
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
  }
]

const LINE_ITEM_AND_SELECTOR = [
  {
    value: "AndSelector",
    label: "And Selector",
    description: "Only qualifies if all of the requirements are met",
    inputs: {
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS],
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS],
    }
  }
]

const LINE_ITEM_OR_SELECTOR = [
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
  }
]


const campaigns = [
  {
    value: "DiscountUsingSelector",
    label: "Discount Using Selector",
    description: "Applies a discount to each item that matches the selector if the cart qualifies",
    inputs: {
      cart_qualifier: [...CART_QUALIFIERS],
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS, ...LINE_ITEM_AND_SELECTOR],
      discount_to_apply: [...DISCOUNTS]
    }
  }
]

export default {
  classes,
  defaultCode,
  campaigns
}