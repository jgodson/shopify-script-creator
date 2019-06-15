require './spec/models/customer'

FactoryBot.define do
  skip_create

  factory :customer do
    transient do
      email { nil }
    end

    after(:create) { |customer, evaluator| customer.email = evaluator.email if evaluator.email }
  end
end
