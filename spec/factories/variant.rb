require './spec/models/variant'

FactoryBot.define do
  skip_create

  factory :variant do
    id { Random.new.rand(1..3432) }
    price { Money.new(cents: 1000) }
    product { create(:product) }
    grams { 0 }
    skus { [] }
    title { "Black Large" }

    trait :with_compare_at_price do
      compare_at_price { Money.new(cents: 1500) }
    end

    trait :mid_priced do
      price { Money.new(cents: 8000) }
      compare_at_price { Money.new(cents: 9500) }
    end

    trait :high_priced do
      price { Money.new(cents: 14999) }
      compare_at_price { nil }
    end

    trait :light do
      grams { 100 }
    end

    trait :heavy do
      grams { 5000 }
    end

    trait :with_sku do
      skus { ["skuABC"] }
    end
  end
end
