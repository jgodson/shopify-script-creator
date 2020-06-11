require './spec/models/cart'

FactoryBot.define do
  skip_create

  factory :cart do
    line_items { nil }
    customer { nil }
    shipping_address { nil }
    cart_discount { nil }

    transient do
      original_price { nil }
    end

    trait :with_fixed_discount do
      cart_discount { create(:fixed_discount) }
    end

    trait :with_percentage_discount do
      cart_discount { create(:percentage_discount) }
    end

    trait :with_shipping_discount do
      cart_discount { create(:shipping_discount) }
    end

    initialize_with { new(line_items, customer, shipping_address, cart_discount) }

    after(:create) { |cart, evaluator| cart.original_price = evaluator.original_price if evaluator.original_price }
  end
end
