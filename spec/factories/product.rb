require './spec/models/product'

FactoryBot.define do
  skip_create

  factory :product do
    id { Random.new.rand(1..3432) }
    tags { [] }
    product_type { "alcohol" }
    vendor { "Test Vendor" }

    trait :gift_card do
      product_type { "Gift Card" }
    end

    trait :with_tags do
      tags { ["tagA", "tagB"] }
    end
  end
end
