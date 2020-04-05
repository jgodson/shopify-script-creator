module TestHelper
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
end
