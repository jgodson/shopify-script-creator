module CartDiscount
  class BaseDiscount
    attr_accessor :code

    def initialize
      @rejected = false
    end

    def reject(message:)
      @rejected = true
      @message = message
    end

    def rejected
      @rejected
    end
  end

  class FixedDiscount < BaseDiscount
    attr_accessor :amount
  end

  class PercentageDiscount < BaseDiscount
    attr_accessor :percentage
  end

  class Shipping < BaseDiscount
  end
end
