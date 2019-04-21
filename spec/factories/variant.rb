require './spec/models/variant'

FactoryBot.define do
  skip_create

  factory :variant do
    id { Random.new.rand(1..3432) }
    price { Money.new(cents: 1000) }
    product { create(:product) }
    skus { [] }
    title { "Black Large" }

    trait :with_compare_at_price do
      compare_at_price { Money.new(cents: 1500) }
    end

    trait :with_sku do
      skus { ["skuABC"] }
    end
  end
end
