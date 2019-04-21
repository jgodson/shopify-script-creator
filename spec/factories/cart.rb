require './spec/models/cart'

FactoryBot.define do
  skip_create

  factory :cart do
    line_items { nil }
    customer { nil }
    shipping_address { nil }
    discount_code { nil }

    trait :with_line_item do
      line_items { create(:line_item) }
    end

    trait :with_shipping_address do
      shipping_address { create(:shipping_address) }
    end

    trait :with_discount_code do
      discount_code { create(:discount_code) }
    end

    initialize_with { new(line_items, customer, shipping_address, discount_code) }
  end
end
