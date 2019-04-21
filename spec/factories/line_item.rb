require './spec/models/line_item'

FactoryBot.define do
  skip_create

  factory :line_item do
    variant { create(:variant) }
    quantity { 1 }
    grams { 0 }
    properties { {} }

    trait :with_line_item do
      line_items { create(:line_item) }
    end

    initialize_with { new(varaint, quantity) }
  end
end
