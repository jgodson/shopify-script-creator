const classes = {
  Campaign: `
class Campaign
  def initialize(condition, *qualifiers)
    @condition = condition == :default ? :all? : (condition.to_s + '?').to_sym
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
    @unmodified_line_items = cart.line_items.map(&:to_hash) if @post_amount_qualifier
    @qualifiers.send(@condition) do |qualifier|
      is_selector = qualifier.is_a?(Selector) rescue false
      if is_selector
        raise "Missing line item match type" if @li_match_type.nil?
        cart.line_items.send(@li_match_type) { |item| qualifier.match?(item) }
      else
        qualifier.match?(cart, @line_item_selector)
      end
    end
  end

  def revert_changes(cart)
    cart.instance_variable_set(:@line_items, @unmodified_line_items)
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
      else
        raise "Invalid comparison type"
    end
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

  GiftCardSelector: `
class GiftCardSelector < Selector
  def initialize(match_type)
    @invert = match_type == :not
  end

  def match?(line_item)
    @invert ^ line_item.variant.product.gift_card?
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

  ReducedItemSelector: `
class ReducedItemSelector < Selector
  def initialize(match_type)
    @invert = match_type == :not
  end

  def match?(line_item)
    @invert ^ line_item.discounted?
  end
end`,

  CustomerEmailQualifier: `
class CustomerEmailQualifier < Qualifier
  def initialize(match_type, match_condition, emails)
    @invert = match_type == :does_not
    @match_condition = match_condition == :default ? :match : match_condition
    @emails = emails.map(&:downcase)
  end

  def match?(cart, selector = nil)
    return false if cart.customer.nil?
    customer_email = cart.customer.email
    case @match_condition
      when :match
        return @invert ^ @emails.include?(customer_email)
      else
        return @invert ^ partial_match(@match_condition, customer_email, @emails)
    end
  end
end`,

  CustomerTagQualifier: `
class CustomerTagQualifier < Qualifier
  def initialize(match_type, match_condition, tags)
    @match_condition = match_condition == :default ? :match : match_condition
    @invert = match_type == :does_not
    @tags = tags.map(&:downcase)
  end

  def match?(cart, selector = nil)
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

  CustomerOrderCountQualifier: `
class CustomerOrderCountQualifier < Qualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type == :default ? :greater_than : comparison_type
    @amount = amount
  end

  def match?(cart, selector = nil)
    return false if cart.customer.nil?
    total = cart.customer.orders_count
    compare_amounts(total, @comparison_type, @amount)
  end
end`,

  CustomerTotalSpentQualifier: `
class CustomerTotalSpentQualifier < Qualifier
  def initialize(comparison_type, amount)
    @comparison_type = comparison_type == :default ? :greater_than : comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    return false if cart.customer.nil?
    total = cart.customer.total_spent
    compare_amounts(total, @comparison_type, @amount)
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

  CodeQualifier: `
class CodeQualifier < Qualifier
  def initialize(match_type, match_condition, codes)
    @match_condition = match_condition == :default ? :match : match_condition
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

  CountryAndProvinceQualifier: `
class CountryAndProvinceQualifier < Qualifier
  def initialize(match_type, country_map)
    @invert = match_type == :not_one
    @country_map = country_map
  end

  def match?(cart, selector = nil)
    return if cart.shipping_address.nil?
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
    return false if shipping_address.nil?
    @invert ^ @country_codes.include?(shipping_address.country_code.upcase)
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

  VariantSkuSelector: `
class VariantSkuSelector < Selector
  def initialize(match_type, match_condition, skus)
    @invert = match_type == :does_not
    @match_condition = match_condition == :default ? :match : match_condition
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

  ProductTagSelector: `
class ProductTagSelector < Selector
  def initialize(match_type, match_condition, tags)
    @match_condition = match_condition == :default ? :match : match_condition
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

  CartAmountQualifier: `
  class CartAmountQualifier < Qualifier
  def initialize(cart_or_item, comparison_type, amount)
    @cart_or_item = cart_or_item == :default ? :cart : cart_or_item
    @comparison_type = comparison_type == :default ? :greater_than : comparison_type
    @amount = Money.new(cents: amount * 100)
  end

  def match?(cart, selector = nil)
    total = cart.subtotal_price
    if @cart_or_item == :item
      total = cart.line_items.reduce(Money.zero) do |total, item|
        total += selector.match?(item) ? item.original_line_price : Money.zero
      end
    end
    compare_amounts(total, @comparison_type, @amount)
  end
end`,

  TotalWeightQualifier: `
class TotalWeightQualifier < Qualifier
  def initialize(comparison_type, amount, units)
    @comparison_type = comparison_type == :default ? :greater_than : comparison_type
    @amount = amount
    @units = units == :default ? :g : units
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

  def match?(cart)
    cart_weight = cart.total_weight
    case @units
      when :lb
        cart_weight = g_to_lb(cart_weight)
      when :kg
        cart_weight = g_to_kg(cart_weight)
      when :oz
        cart_weight = g_to_oz(cart_weight)
    end

    compare_amounts(total, @comparison_type, @amount)
  end
end`
};

const customerQualifiers = [
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
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
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
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
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

const cartQualifiers = [
  {
    value: "none",
    label: "None",
    description: "No effects"
  },
  {
    value: "CartAmountQualifier",
    label: "Cart/Item Total",
    description: "Will only apply if cart subtotal or qualified item total meets conditions",
    inputs: {
      cart_or_item_total: {
        type: "select",
        description: "Cart subtotal or item total",
        options: [
          {
            value: "cart",
            label: "Cart subtotal"
          },
          {
            value: "item",
            label: "Qualified item total"
          },
        ]
      },
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
    value: "TotalWeightQualifier",
    label: "Cart Total Weight",
    description: "Qualifies cart based on total weight of products.",
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
        description: "Weight to compare to"
      },
      units: {
        type: "select",
        description: "Units for weight",
        options: [
          {
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
        description: "Set how the discount code is matched",
        options: [
          {
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
            value: "ends_with",
            label: "End with one of"
          }
        ]
      },
      discount_codes: {
        type: "array",
        description: "Seperate individual codes with a comma (,)"
      }
    }
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
      countries_and_provinces: {
        type: "object",
        description: "Country codes and the provice/state codes to match. Format: (Country: Provinces)",
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
      country_codes: {
        type: "array",
        description: "Seperate individual country codes with a comma (,)"
      }
    }
  }
];

const lineItemSelectors = [
  {
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
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
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
            value: "include",
            label: "Contain one of"
          },
          {
            value: "start_with",
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
        description: "Properties must match all entered key/value pairs. Format: (Key : Value)",
        inputFormat: "{key:text:The property's key} : {value:text:The value of the property}",
        outputFormat: '"{text}" => "{text}"'
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
        options: [
          {
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
        options: [
          {
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
        options: [
          {
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

export default {
  classes,
  customerQualifiers,
  cartQualifiers,
  lineItemSelectors
}