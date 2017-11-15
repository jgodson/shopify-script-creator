const classes = `\
# Combines selectors together and returns true if they all match
class AndSelector
  def initialize(*selectors)
    @selectors = selectors
  end

  def match?(item)
    @selectors.all? do |selector|
      selector.nil? || selector.match?(item) 
    end
  end
end

# Combines selectors together and returns true if any of them match
class OrSelector
  def initialize(*selectors)
    @selectors = selectors
  end

  def match?(item)
    @selectors.any? do |selector|
      next if selector.nil?
      return selector.match?(item) 
    end
  end
end

# Checks to see if the product is a gift card, returns true if it is
class ExcludeGiftCards
  def match?(line_item)
    !line_item.variant.product.gift_card?
  end
end

# Checks to see if a specific discount code is present
class HasDiscountCode
  def initialize(match_type, code)
    @match_type = match_type
    @code = code.downcase
  end
  def match?(cart)
    return true if cart.discount_code.nil?
    entered_code = cart.discount_code.code.downcase
    case @match_type
      when :is_equal
        return entered_code == @code
      when :not_equal
        return entered_code != @code
      when :contains
        return entered_code.include?(@code)
      when :starts_with
        return entered_code.start_with?(@code)
      when :ends_with
        return entered_code.end_with?(@code)
    end
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

class ProductIdSelector
  def initialize(match_type, product_ids)
    @invert = match_type == :is_one ? false : true
    @product_ids = product_ids.map { |id| id.to_i }
  end

  def match?(line_item)
    @invert ^ @product_ids.include?(line_item.variant.product.id)
  end
end

class ProductTagSelector
def initialize(match_type, tags)
  @match_type = match_type
  @tags = tags.map(&:downcase)
end

def match?(line_item)
  product_tags = line_item.variant.product.tags.to_a.map(&:downcase)
  case @match_type
    when :is_one
      return (@tags & product_tags).length > 0
    when :not_one
      return (@tags & product_tags).length == 0
    when :contains
      return @tags.any? do |required_tag|
        product_tags.any? do |product_tag|
          product_tag.include?(required_tag)
        end
      end
    when :starts_with
      return @tags.any? do |required_tag|
        product_tags.any? do |product_tag|
          puts "#{required_tag} st_with #{product_tag}"
          product_tag.start_with?(required_tag)
        end
      end
    when :ends_with
      return @tags.any? do |required_tag|
        product_tags.any? do |product_tag|
          puts "#{required_tag} ed_with #{product_tag}"
          product_tag.end_with?(required_tag)
        end
      end
  end
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

# BOGO campaign
class BuyXGetX
  def initialize(cart_qualifier, buy_item_qualifier, get_item_qualifier, discount, buy_x, get_x, max_sets)
    raise "buy_x must be greater than or equal to get_x" unless buy_x >= get_x
    
    @cart_qualifier = cart_qualifier
    @buy_item_qualifier = buy_item_qualifier
    @get_item_qualifier = get_item_qualifier
    @discount = discount
    @buy_x = buy_x + get_x
    @get_x = get_x
    @max_sets = max_sets == 0 ? nil : max_sets
  end
  
  def run(cart)
    # Make sure the cart qualifies for the offer
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
end`;

const defaultCode = `
CAMPAIGNS = [
|
].freeze

CAMPAIGNS.each do |campaign|
  campaign.run(Input.cart)
end

Output.cart = Input.cart`;

const CART_QUALIFIERS = [
  {
    value: "none",
    label: "None",
    description: "No additional conditions"
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
    description: "Do not allow discount codes and script discount to combine",
    inputs: {
      reject_discount_code: {
        type: "boolean",
        description: "Enable to reject code and apply script. Leave disabled to apply discount code only.",
      },
      rejection_message: {
        type: "text",
        description: "Will be shown to the customer if discount code was rejected"
      }
    }
  },
  {
    value: "HasDiscountCode",
    label: "Has Discount Code",
    description: "Checks to see if the discount code entered matches conditions",
    inputs: {
      match_condition: {
        type: 'select',
        description: "Set how discount code is matched",
        options: [
          {
            value: "is_equal",
            label: "Is equal to"
          },
          {
            value: "not_equal",
            label: "Is not equal to"
          },
          {
            value: "contains",
            label: "Contains"
          },
          {
            value: "starts_with",
            label: "Stars with"
          },
          {
            value: "ends_with",
            label: "Ends with"
          }
        ]
      },
      discount_code: {
        type: "text",
        description: "Discount code to check for"
      }
    }
  }
]

const LINE_ITEM_QUALIFIERS = [
  {
    value: "none",
    label: "None",
    description: "No additional conditions"
  },
  {
    value: "ProductIdSelector",
    label: "Product ID Selector",
    description: "Selects line items by product ID",
    inputs: {
      condition: {
        type: "select",
        description: "Set how product ID's are matched",
        options: [
          {
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
        description: "Seperate individual product ID's with a comma (,)"
      }
    }
  },
  {
    value: "ProductTagSelector",
    label: "Product Tag Selector",
    description: "Selects line items by product tag",
    inputs: {
      condition: {
        type: "select",
        description: "Set how product tags are matched",
        options: [
          {
            value: "is_one",
            label: "Is one of"
          },
          {
            value: "not_one",
            label: "Is not one of"
          },
          {
            value: "contains",
            label: "Contains one of"
          },
          {
            value: "start_with",
            label: "Starts with one of"
          },
          {
            value: "ends_with",
            label: "Ends with one of"
          }
        ]
      },
      product_tags: {
        type: "array",
        description: "Seperate individual product tags with a comma (,)"
      }
    }
  },
  {
    value: "ExcludeGiftCards",
    label: "Exclude Gift Cards",
    description: "Do not include products that are gift cards"
  },
  {
    value: "ExcludeSaleItems",
    label: "Exclude Sale Items",
    description: "Do not include products that are on sale (price is less than compare at price)"
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

const LINE_ITEM_AND_SELECTOR = {
  value: "AndSelector",
  label: "And Selector",
  description: "Qualifies if all of the requirements are met",
  inputs: {
    line_item_qualifier_1: [...LINE_ITEM_QUALIFIERS],
    line_item_qualifier_2: [...LINE_ITEM_QUALIFIERS],
    line_item_qualifier_3: [...LINE_ITEM_QUALIFIERS],
  }
};

const LINE_ITEM_OR_SELECTOR = {
  value: "OrSelector",
  label: "Or Selector",
  description: "Qualifies if any of the requirements are met",
  inputs: {
    line_item_qualifier_1: [...LINE_ITEM_QUALIFIERS],
    line_item_qualifier_2: [...LINE_ITEM_QUALIFIERS],
    line_item_qualifier_3: [...LINE_ITEM_QUALIFIERS]
  }
};

const CART_OR_SELECTOR = {
  value: "OrSelector",
  label: "Or Selector",
  description: "Qualifies if any of the requirements are met",
  inputs: {
    cart_qualifier_1: [...CART_QUALIFIERS],
    cart_qualifier_2: [...CART_QUALIFIERS],
    cart_qualifier_3: [...CART_QUALIFIERS]
  }
};

const CART_AND_SELECTOR = {
  value: "AndSelector",
  label: "And Selector",
  description: "Qualifies if all of the requirements are met",
  inputs: {
    cart_qualifier_1: [...CART_QUALIFIERS],
    cart_qualifier_2: [...CART_QUALIFIERS],
    cart_qualifier_3: [...CART_QUALIFIERS]
  }
};


const campaigns = [
  {
    value: "DiscountUsingSelector",
    label: "Discount Using Selector",
    description: "Applies a discount to each item that matches the selector if the cart qualifies",
    inputs: {
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      line_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      discount_to_apply: [...DISCOUNTS]
    }
  },
  {
    value: "BuyXGetX",
    label: "Buy X Get X Discounted",
    description: "Applies a discount to items based on multiples of an item",
    inputs: {
      cart_qualifier: [...CART_QUALIFIERS, CART_AND_SELECTOR, CART_OR_SELECTOR],
      buy_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
      get_item_qualifier: [...LINE_ITEM_QUALIFIERS, LINE_ITEM_AND_SELECTOR, LINE_ITEM_OR_SELECTOR],
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
  }
];

export default {
  classes,
  defaultCode,
  campaigns
};