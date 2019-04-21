module TestHelper
  class NeverQualifier
    def match?(cart, selector = nil)
      false
    end
  end
end
