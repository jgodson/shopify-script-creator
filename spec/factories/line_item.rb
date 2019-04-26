require './spec/models/line_item'

FactoryBot.define do
  skip_create

  factory :line_item do
    variant { nil }
    quantity { 1 }
    grams { 0 }
    properties { {} }

    initialize_with { new(variant, quantity) }

    after(:create) do |line_item, evaluator|
      line_item.original_line_price = evaluator.original_line_price if evaluator.original_line_price
    end
  end
end
