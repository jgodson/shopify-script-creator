const classes = {
  AndSelector: `
class AndSelector
  def initialize(*selectors)
    @selectors = selectors
  end

  def match?(item)
    @selectors.all? do |selector|
      selector.nil? || selector.match?(item) 
    end
  end
end`,

  OrSelector: `
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
end`,

  HasDiscountCode: `
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
end`,

  ProductIdSelector: `
class ProductIdSelector
  def initialize(match_type, product_ids)
    @invert = match_type != :is_one;
    @product_ids = product_ids.map { |id| id.to_i }
  end

  def match?(line_item)
    @invert ^ @product_ids.include?(line_item.variant.product.id)
  end
end`,

  ProductTypeSelector: `
class ProductTypeSelector
  def initialize(match_type, product_types)
    @invert = match_type == :is_one ? false : true
    @product_types = product_types.map(&:downcase)
  end

  def match?(line_item)
    @invert ^ @product_types.include?(line_item.variant.product.product_type)
  end
  end

  class ProductVendorSelector
  def initialize(match_type, vendors)
    @invert = match_type == :is_one ? false : true
    @vendors = vendors.map(&:downcase)
  end

  def match?(line_item)
    @invert ^ @vendors.include?(line_item.variant.product.vendor)
  end
end`,

  VariantSkuSelector: `
class VariantSkuSelector
  def initialize(match_type, skus)
    @match_type = match_type
    @skus = skus.map(&:downcase)
  end

  def match?(line_item)
    variant_skus = line_item.variant.skus.to_a.map(&:downcase)
    case @match_type
      when :is_one
        return (@skus & variant_skus).length > 0
      when :not_one
        return (@skus & variant_skus).length == 0
      when :contains
        return @skus.any? do |required_sku|
          variant_skus.any? do |sku|
            sku.include?(required_sku)
          end
        end
      when :starts_with
        return @skus.any? do |required_sku|
          variant_skus.any? do |sku|
            sku.start_with?(required_sku)
          end
        end
      when :ends_with
        return @skus.any? do |required_sku|
          variant_skus.any? do |sku|
            sku.end_with?(required_sku)
          end
        end
    end
  end
end`,

  VariantIdSelector: `
class VariantIdSelector
  def initialize(match_type, variant_ids)
    @invert = match_type == :is_one ? false : true
    @variant_ids = variant_ids.map { |id| id.to_i }
  end

  def match?(line_item)
    @invert ^ @variant_ids.include?(line_item.variant.id)
  end
end`,

  ProductTagSelector: `
class ProductTagSelector
  def initialize(invert, match_type, tags)
    @match_type = match_type
    @invert = invert == :does_not
    @tags = tags.map(&:downcase)
  end

  def match?(line_item)
    product_tags = line_item.variant.product.tags.to_a.map(&:downcase)
    case @match_type
      when :match
        return @invert ^ (@tags & product_tags).length > 0
      when :contains
        return @invert ^ @tags.any? do |required_tag|
          product_tags.any? do |product_tag|
            product_tag.include?(required_tag)
          end
        end
      when :starts_with
        return @invert ^ @tags.any? do |required_tag|
          product_tags.any? do |product_tag|
            product_tag.start_with?(required_tag)
          end
        end
      when :ends_with
        return @invert ^ @tags.any? do |required_tag|
          product_tags.any? do |product_tag|
            product_tag.end_with?(required_tag)
          end
        end
    end
  end
end`,

  CartAmountQualifier: `
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
end`
};

const customer_qualifiers = [
  {
    value: "none",
    label: "None",
    description: "No additional conditions"
  }
];

const cart_qualifiers = [
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
            label: "Starts with"
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
];

const line_item_qualifiers = [
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
        description: "Set how tags are matched",
        options: [
          {
            value: "does",
            label: "Does"
          },
          {
            value: "does_not",
            label: "Does not"
          }
        ]
      },
      match_type: {
        type: "select",
        description: "Set what portion of the tags to compare",
        options: [
          {
            value: "match",
            label: "Match one of"
          },
          {
            value: "contains",
            label: "Contain one of"
          },
          {
            value: "starts_with",
            label: "Start with one of"
          },
          {
            value: "ends_with",
            label: "End with one of"
          }
        ]
      },
      product_tags: {
        type: "array",
        description: "Seperate individual product tags with a comma (,)"
      }
    }
  }
]

export default {
  classes,
  customer_qualifiers,
  cart_qualifiers,
  line_item_qualifiers
}