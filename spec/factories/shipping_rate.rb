require './spec/models/shipping_rate'

FactoryBot.define do
  skip_create

  factory :shipping_rate do
    code { "Gateway1" }
    markup { "Markup" }
    name { "Rate Name" }
    source { "Shopify" }
    phone_required { false }

    transient do
      price { Money.new(cents: 10_00) }
    end

    after(:create) { |rate, evaluator| rate.price = evaluator.price if evaluator.price }
  end
end
