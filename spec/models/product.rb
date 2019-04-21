class Product
  attr_accessor :id, :tags, :product_type, :vendor

  def gift_card?
    product_type == "gift_card"
  end
end
