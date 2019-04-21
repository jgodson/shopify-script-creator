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
end
