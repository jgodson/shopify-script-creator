require "./ruby_scripts/common/cart_amount_qualifier"

RSpec.describe CartAmountQualifier, "#match?" do
  let(:line_items) {[
    create(:line_item, variant: create(:variant, id: 123)),
    create(:line_item, variant: create(:variant, :mid_priced), quantity: 3)
  ]}
  let(:selector) { TestHelper::VariantIdMatcher.new(123) }
  let(:cart) { create(:cart, line_items: line_items) }

  describe "with :cart behaviour" do
    it "includes the price of all items in the cart" do
      expect(
        CartAmountQualifier.new(
          :cart,
          :equal_to,
          250,
        ).match?(cart)
      ).to be(true)
    end
  end

  describe "with :item behaviour" do
    it "only counts the price of matching items" do
      expect(
        CartAmountQualifier.new(
          :item,
          :equal_to,
          10,
        ).match?(cart, selector)
      ).to be(true)
    end

    it "does not count any items when no selector is provided" do
      expect(
        CartAmountQualifier.new(
          :item,
          :equal_to,
          0,
        ).match?(cart)
      ).to be(true)
    end
  end

  describe "with :diff_cart behaviour" do
    context "with no discounts applied" do
      let(:cart) { create(:cart, line_items: line_items) }

      it "should equal 0" do
        expect(
          CartAmountQualifier.new(
            :diff_cart,
            :equal_to,
            0,
          ).match?(cart)
        ).to be(true)
      end
    end

    context "with a cart value $10 less than the original price" do
      let(:cart) { create(:cart, line_items: line_items, original_price: Money.new(cents: 26000)) }

      it "matches when given $10 as the comparison amount to equal" do
        expect(
          CartAmountQualifier.new(
            :diff_cart,
            :equal_to,
            10,
          ).match?(cart)
        ).to be(true)
      end
    end
  end

  describe "with :diff_item behaviour" do
    let(:cart) { create(:cart, line_items: line_items) }

    it "should equal 0 with no discounts applied" do
      expect(
        CartAmountQualifier.new(
          :diff_item,
          :equal_to,
          0,
        ).match?(cart)
      ).to be(true)
    end

    context "with a line item that was previously discounted by $10" do
      let(:line_items) {[
        create(:line_item, variant: create(:variant, id: 123), original_line_price: Money.new(cents: 2000)),
        create(:line_item, variant: create(:variant, :mid_priced), quantity: 3)
      ]}

      it "matches when given $10 as the comparison amount to equal" do
        expect(
          CartAmountQualifier.new(
            :diff_item,
            :equal_to,
            10,
          ).match?(cart, selector)
        ).to be(true)
      end
    end
  end
end
