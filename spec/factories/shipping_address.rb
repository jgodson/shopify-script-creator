require './spec/models/shipping_address'

FactoryBot.define do
  skip_create

  factory :shipping_address do
    name { nil }
    address1 { nil }
    address2 { nil }
    phone { nil }
    city { nil }
    zip { nil }
    province { nil }
    province_code { nil }
    country_code { nil }
  end
end
