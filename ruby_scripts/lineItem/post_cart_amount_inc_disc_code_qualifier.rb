class PostCartAmountIncDiscCodeQualifier < PostCartAmountQualifier
  def initialize(comparison_type, amount)
    super(comparison_type, amount)
  end

  def match?(cart, selector = nil)
    total =
    case cart.discount_code
      when CartDiscount::Percentage
        if cart.subtotal_price >= cart.discount_code.minimum_order_amount
          cart_subtotal_without_gc = cart.line_items.reduce(Money.zero) do |total, item|
            total + (item.variant.product.gift_card? ? Money.zero : item.line_price)
          end
          gift_card_amount = cart.subtotal_price - cart_subtotal_without_gc
          cart_subtotal_without_gc * ((Decimal.new(100) - cart.discount_code.percentage) / 100) + gift_card_amount
        else
          cart.subtotal_price
        end
      when CartDiscount::FixedAmount
        if cart.subtotal_price >= cart.discount_code.minimum_order_amount
          [cart.subtotal_price - cart.discount_code.amount, Money.zero].max
        else
          cart.subtotal_price
        end
      else
        cart.subtotal_price
    end
    compare_amounts(total, @comparison_type, @amount)
  end
end
