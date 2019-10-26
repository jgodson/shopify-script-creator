class ShippingRate
  attr_accessor :code, :markup, :name, :price, :source, :phone_required

  def change_name(new_name, message:)
    @name = new_name
  end

  def apply_discount(discount, message:)
    new_price = @price - @discount

    @adjustments ||= []
    adjustments << Adjustment.new(property: :price, old_value: @price, new_value: new_price, message: message)

    @price = new_price
  end
end
