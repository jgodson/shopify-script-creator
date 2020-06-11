require "./ruby_scripts/lineItem/discount_code_pattern_match"

RSpec.describe DiscountCodePatternMatch, "#run" do
  let(:line_items) {[
    create(:line_item, variant: create(:variant, id: 1), quantity: 1),
  ]}
  let(:entered_code) { "XFUO-SD89" }
  let(:cart_discount) { create(:percentage_discount, code: entered_code) }
  let(:cart) { create(:cart, line_items: line_items, cart_discount: cart_discount) }
  let(:patterns_input) { ["****"] }
  let(:discount) { TestHelper::Discounts::PercentageDiscount.new(10, "discount") }

  describe "when there is no discount code entered" do
    let(:cart_discount) { nil }

    it "does not apply discount" do
      described_class.new(
        :all,
        nil,
        nil,
        nil,
        discount,
        patterns_input
      ).run(cart)

      expect(cart.subtotal_price).to eq(Money.new(cents: 1000))
    end
  end

  describe "when the pattern does not match" do
    it "does not apply discount" do
      described_class.new(
        :all,
        nil,
        nil,
        nil,
        discount,
        patterns_input
      ).run(cart)

      expect(cart.subtotal_price).to eq(Money.new(cents: 1000))
    end
  end

  describe "when the pattern does match" do
    let(:patterns_input) { ["****-****"] }

    it "applies discount" do
      described_class.new(
        :all,
        nil,
        nil,
        nil,
        discount,
        patterns_input
      ).run(cart)

      expect(cart.subtotal_price).to eq(Money.new(cents: 900))
    end

    it "respects the line item selector" do
      described_class.new(
        :all,
        nil,
        nil,
        TestHelper::VariantIdMatcher.new(2),
        discount,
        patterns_input
      ).run(cart)

      expect(cart.subtotal_price).to eq(Money.new(cents: 1000))
    end
  end

  describe "with multiple patterns as the input" do
    let(:patterns_input) { ["****", "****-****"] }

    it "applies discount when the pattern is the second pattern in the list" do
      described_class.new(
        :all,
        nil,
        nil,
        nil,
        discount,
        patterns_input
      ).run(cart)

      expect(cart.subtotal_price).to eq(Money.new(cents: 900))
    end
  end

  describe "with a very specific pattern" do
    context "when it matches exactly" do
      let(:patterns_input) { ["XFUO-SD89"] }

      it "applies discount" do
        described_class.new(
          :all,
          nil,
          nil,
          nil,
          discount,
          patterns_input
        ).run(cart)

        expect(cart.subtotal_price).to eq(Money.new(cents: 900))
      end
    end

    context "when it doesn't exactly match" do
      let(:patterns_input) { ["XFUO-SD88"] }

      it "applies discount" do
        described_class.new(
          :all,
          nil,
          nil,
          nil,
          discount,
          patterns_input
        ).run(cart)

        expect(cart.subtotal_price).to eq(Money.new(cents: 1000))
      end
    end

    context "when there is a wildcard somewhere in the pattern" do
      let(:patterns_input) { ["XFUO-*D89"] }

      it "applies discount" do
        described_class.new(
          :all,
          nil,
          nil,
          nil,
          discount,
          patterns_input
        ).run(cart)

        expect(cart.subtotal_price).to eq(Money.new(cents: 900))
      end
    end

  end
end
