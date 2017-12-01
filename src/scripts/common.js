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

  CustomerEmailQualifier: `
class CustomerEmailQualifier
  def initialize(match_type, match_condition, emails)
    @invert = match_type == :does_not
    @match_condition = match_condition == :undefined ? :match : match_condition
    @emails = emails.map(&:downcase)
  end

  def match?(cart)
    return false if cart.customer.nil?
    customer_email = cart.customer.email
    case @match_condition
      when :match
        return @invert ^ @emails.include?(customer_email)
      when :contains
        return @invert ^ @emails.any? do |partial|
          customer_email.include?(partial)
        end
      when :starts_with
        return @invert ^ @emails.any? do |partial|
          customer_email.start_with?(partial)
        end
      when :ends_with
        return @invert ^ @emails.any? do |partial|
        customer_email.end_with?(partial)
      end
    end
  end
end`,

  CustomerTagQualifier: `
class CustomerTagQualifier
  def initialize(match_type, match_condition, tags)
    @match_condition = match_condition == :undefined ? :match : match_condition
    @invert = match_type == :does_not
    @tags = tags.map(&:downcase)
  end

  def match?(cart)
    return false if cart.customer.nil?
    customer_tags = cart.customer.tags.to_a.map(&:downcase)
    case @match_condition
      when :match
        return @invert ^ ((@tags & customer_tags).length > 0)
      when :contains
        return @invert ^ @tags.any? do |partial_tag|
          customer_tags.any? do |customer_tag|
            customer_tag.include?(partial_tag)
          end
        end
      when :starts_with
        return @invert ^ @tags.any? do |partial_tag|
          customer_tags.any? do |customer_tag|
            customer_tag.start_with?(partial_tag)
          end
        end
      when :ends_with
        return @invert ^ @tags.any? do |partial_tag|
          customer_tags.any? do |customer_tag|
            customer_tag.end_with?(partial_tag)
          end
        end
    end
  end
end`,

  CustomerOrderCountQualifier: `
class CustomerOrderCountQualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = amount
  end

  def match?(cart)
    return false if cart.customer.nil?
    total = cart.customer.orders_count
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
end`,

  CustomerTotalSpentQualifier: `
class CustomerTotalSpentQualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart)
    return false if cart.customer.nil?
    total = cart.customer.total_spent
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
end`,

  CustomerAcceptsMarketingQualifier: `
class CustomerAcceptsMarketingQualifier
  def initialize(match_type)
    @invert = match_type == :does_not
  end

  def match?(cart)
    return false if cart.customer.nil?
    return @invert ^ cart.customer.accepts_marketing?
  end
end`,

  HasCode: `
class HasCode
  def initialize(match_type, match_condition, code)
    @invert = match_type == :does_not
    @match_condition = match_condition == :undefined ? :is_equal : match_condition
    @code = code.downcase
  end

  def match?(cart)
    return false if cart.discount_code.nil?
    entered_code = cart.discount_code.code.downcase
    case @match_condition
      when :is_equal
        return @invert ^ (entered_code == @code)
      when :contains
        return @invert ^ entered_code.include?(@code)
      when :starts_with
        return @invert ^ entered_code.start_with?(@code)
      when :ends_with
        return @invert ^ entered_code.end_with?(@code)
    end
  end
end`,

  ProductIdSelector: `
class ProductIdSelector
  def initialize(match_type, product_ids)
    @invert = match_type == :not_one;
    @product_ids = product_ids.map { |id| id.to_i }
  end

  def match?(line_item)
    @invert ^ @product_ids.include?(line_item.variant.product.id)
  end
end`,

  ProductTypeSelector: `
class ProductTypeSelector
  def initialize(match_type, product_types)
    @invert = match_type == :not_one
    @product_types = product_types.map(&:downcase)
  end

  def match?(line_item)
    @invert ^ @product_types.include?(line_item.variant.product.product_type)
  end
end`,

  ProductVendorSelector: `
  class ProductVendorSelector
  def initialize(match_type, vendors)
    @invert = match_type != :is_one
    @vendors = vendors.map(&:downcase)
  end

  def match?(line_item)
    @invert ^ @vendors.include?(line_item.variant.product.vendor.downcase)
  end
end`,

  VariantSkuSelector: `
class VariantSkuSelector
  def initialize(match_type, match_condition, skus)
    @invert = match_type == :does_not
    @match_condition = match_condition == :undefined ? :match : match_condition
    @skus = skus.map(&:downcase)
  end

  def match?(line_item)
    variant_skus = line_item.variant.skus.to_a.map(&:downcase)
    case @match_condition
      when :match
        return @invert ^ ((@skus & variant_skus).length > 0)
      when :contains
        return @invert ^ @skus.any? do |required_sku|
          variant_skus.any? do |sku|
            sku.include?(required_sku)
          end
        end
      when :starts_with
        return @invert ^ @skus.any? do |required_sku|
          variant_skus.any? do |sku|
            sku.start_with?(required_sku)
          end
        end
      when :ends_with
        return @invert ^ @skus.any? do |required_sku|
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
    @invert = match_type == :not_one
    @variant_ids = variant_ids.map { |id| id.to_i }
  end

  def match?(line_item)
    @invert ^ @variant_ids.include?(line_item.variant.id)
  end
end`,

  ProductTagSelector: `
class ProductTagSelector
  def initialize(match_type, match_condition, tags)
    @match_condition = match_condition == :undefined ? :match : match_condition
    @invert = match_type == :does_not
    @tags = tags.map(&:downcase)
  end

  def match?(line_item)
    product_tags = line_item.variant.product.tags.to_a.map(&:downcase)
    case @match_condition
      when :match
        return @invert ^ ((@tags & product_tags).length > 0)
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

  LineItemPropertiesSelector: `
class LineItemPropertiesSelector
  def initialize(target_properties)
    @target_properties = target_properties
  end

  def match?(line_item)
    line_item_props = line_item.properties
    @target_properties.all? do |key, value|
      next unless line_item_props.has_key?(key)
      next true if line_item_props[key].downcase == value.downcase
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
      match_condition: {
        type: "select",
        description: "Set how the email is matched",
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
      customer_emails: {
        type: "array",
        description: "Seperate individual emails with a comma (,)"
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
      match_condition: {
        type: "select",
        description: "Set how the tags are matched",
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
      customer_tags: {
        type: "array",
        description: "Seperate individual tags with a comma (,)"
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
    value: "CustomerAcceptsMarketingQualifier",
    label: "Customer Accepts Marketing",
    description: "Qualifies if the customer does or does not accept marketing",
    inputs: {
      qualifing_condition: {
        type: "select",
        description: "Set the condition that the customer qualifies",
        options: [
          {
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

const cart_qualifiers = [
  {
    value: "none",
    label: "None",
    description: "No effects"
  },
  {
    value: "CartAmountQualifier",
    label: "Cart Subtotal",
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
    value: "HasCode",
    label: "Has Specific Discount Code",
    description: "Checks to see if the discount code entered matches conditions",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the following condition matches",
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
      match_condition: {
        type: 'select',
        description: "Set how discount code is matched",
        options: [
          {
            value: "is_equal",
            label: "Equal"
          },
          {
            value: "contains",
            label: "Contain"
          },
          {
            value: "starts_with",
            label: "Start with"
          },
          {
            value: "ends_with",
            label: "End with"
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
    description: "No effects"
  },
  {
    value: "ProductIdSelector",
    label: "Product ID",
    description: "Selects line items by product ID",
    inputs: {
      match_condition: {
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
    value: "ProductTypeSelector",
    label: "Product Type",
    description: "Selects line items by product type",
    inputs: {
      match_condition: {
        type: "select",
        description: "Set how product types are matched",
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
      product_types: {
        type: "array",
        description: "Seperate individual product types with a comma (,)"
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
      product_vendors: {
        type: "array",
        description: "Seperate individual product vendors with a comma (,)"
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
      match_condition: {
        type: "select",
        description: "Set how the tags are matched",
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
  },
  {
    value: "VariantSkuSelector",
    label: "Variant SKU",
    description: "Selects line items by variant SKU",
    inputs: {
      match_type: {
        type: "select",
        description: "Set how the following condition matches",
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
      match_condition: {
        type: "select",
        description: "Set how the skus are matched",
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
      variant_skus: {
        type: "array",
        description: "Seperate individual skus with a comma (,)"
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
      variant_IDs: {
        type: "array",
        description: "Seperate individual variant ID's with a comma (,)"
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
        description: "Seperate keys and values with : and individual key/values with a , (eg: key1: value1, key2: value2)",
        inputPattern: '\\s*(?:\\w+\\s*)+:\\s*(?:\\w+\\s*)+,{0,1}',
        // Future implementation of objects (hopefully)
        inputFormat: "{text}: {text}",
        outputFormat: "'{text}'=>'{text}'"
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