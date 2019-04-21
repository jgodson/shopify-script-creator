class Product
  attr_accessor :id, :tags, :product_type, :vendor

  def gift_card?
    product_type == "Gift Card"
  end
end
