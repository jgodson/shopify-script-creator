class TotalWeightQualifier < Qualifier
  def initialize(comparison_type, amount, units)
    @comparison_type = comparison_type
    @amount = amount
    @units = units
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

  def match?(cart, selector = nil)
    cart_weight = cart.total_weight
    case @units
      when :lb
        cart_weight = g_to_lb(cart_weight)
      when :kg
        cart_weight = g_to_kg(cart_weight)
      when :oz
        cart_weight = g_to_oz(cart_weight)
    end

    compare_amounts(cart_weight, @comparison_type, @amount)
  end
end
