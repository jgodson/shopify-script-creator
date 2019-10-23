require './spec/models/cart_discount'

FactoryBot.define do
  factory :percentage_discount, class: CartDiscount::PercentageDiscount do
    code { SecureRandom.alphanumeric(8) }
    percentage { 10 }
  end

  factory :fixed_discount, class: CartDiscount::FixedDiscount do
    code { SecureRandom.alphanumeric(8) }
    amount { Money.new(cents: 10000) }
  end

  factory :shipping_discount, class: CartDiscount::Shipping do
    code { SecureRandom.alphanumeric(8) }
  end
end
