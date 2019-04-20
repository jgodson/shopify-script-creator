require './spec/models/gateway'

FactoryBot.define do
  skip_create

  factory :gateway do
    name { "Gateway1" }
    enabled_card_brands { ["Visa", "MasterCard"] }

    trait :gateway2 do
      name { "Gateway2" }
    end

    trait :gateway3 do
      name { "Gateway3" }
    end
  end
end
