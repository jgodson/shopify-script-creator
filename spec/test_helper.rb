module TestHelper
  class Cart
    def self.get_total_quantity(line_items)
      line_items.reduce(0) { |tot, cur| tot + cur.quantity }
    end
  end

  class NeverQualifier
    def match?(cart, selector = nil)
      false
    end
  end

  class GatewayNameMatcher
    def initialize(name)
      @name = name
    end

    def match?(gateway)
      @name == gateway.name
    end
  end

  class VariantIdMatcher
    def initialize(id)
      @id = id
    end

    def match?(line_item)
      @id == line_item.variant.id
    end
  end

  class ProductIdMatcher
    def initialize(id)
      @id = id
    end

    def match?(line_item)
      @id == line_item.variant.product.id
    end
  end

  class Discounts
    class PercentageDiscount
      def initialize(percent, message)
        @discount = (100 - percent) / 100.0
        @message = message
      end

      def apply(item)
        item.change_line_price(item.line_price * @discount, message: @message)
      end
    end
  end
end
