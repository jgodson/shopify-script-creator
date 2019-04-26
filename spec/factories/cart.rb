require './spec/models/cart'

FactoryBot.define do
  skip_create

  factory :cart do
    line_items { nil }
    customer { nil }
    shipping_address { nil }
    discount_code { nil }

    transient do
      original_price { nil }
    end

    trait :with_shipping_address do
      shipping_address { create(:shipping_address) }
    end

    trait :with_discount_code do
      discount_code { create(:discount_code) }
    end


    initialize_with { new(line_items, customer, shipping_address, discount_code) }

    after(:create) { |cart, evaluator| cart.original_price = evaluator.original_price if evaluator.original_price }
  end
end
