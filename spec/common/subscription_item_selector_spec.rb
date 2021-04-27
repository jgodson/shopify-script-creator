require "./ruby_scripts/common/subscription_item_selector"

RSpec.describe SubscriptionItemSelector, "#match?" do
  let(:subscription_item) { create(:line_item, variant: create(:variant, id: 123, selling_plan_id: 1)) }
  let(:non_subscription_item) { create(:line_item, variant: create(:variant, id: 123)) }

  describe "with :is match_condition" do
    it "matches a subscription item" do
      expect(
        described_class.new(
          :is,
        ).match?(subscription_item)
      ).to be(true)
    end

    it "does not match a non-subscription item" do
      expect(
        described_class.new(
          :is,
        ).match?(non_subscription_item)
      ).to be(false)
    end
  end

  describe "with :not match_condition" do
    it "does not match a subscription item" do
      expect(
        described_class.new(
          :not,
        ).match?(subscription_item)
      ).to be(false)
    end

    it "matches a non-subscription item" do
      expect(
        described_class.new(
          :not,
        ).match?(non_subscription_item)
      ).to be(true)
    end
  end
end
