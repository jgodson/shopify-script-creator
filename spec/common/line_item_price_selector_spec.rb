require "./ruby_scripts/common/line_item_price_selector"

RSpec.describe LineItemPriceSelector, "#match?" do
  let(:variant) { create(:variant) }
  let!(:line_item) { create(:line_item, variant: variant) }

  describe "using :greater_than_equal" do
    let(:behaviour) { :greater_than_equal }

    describe "with a line item variant that has a lower price than passed in" do
      it "returns false" do
        expect(
          described_class.new(
            behaviour,
            11,
          ).match?(line_item)
        ).to be(false)
      end
    end

    describe "with a line item variant that has a higher price than passed in" do
      it "returns true" do
        expect(
          described_class.new(
            behaviour,
            9,
          ).match?(line_item)
        ).to be(true)
      end
    end

    describe "with a line item variant that has equal price as passed in" do
      it "returns true" do
        expect(
          described_class.new(
            behaviour,
            10,
          ).match?(line_item)
        ).to be(true)
      end
    end
  end

  describe "using :less_than_equal" do
    let(:behaviour) { :less_than_equal }

    describe "with a line item variant that has a lower price than passed in" do
      it "returns false" do
        expect(
          described_class.new(
            behaviour,
            11,
          ).match?(line_item)
        ).to be(true)
      end
    end

    describe "with a line item variant that has a higher price than passed in" do
      it "returns true" do
        expect(
          described_class.new(
            behaviour,
            9,
          ).match?(line_item)
        ).to be(false)
      end
    end

    describe "with a line item variant that has equal price as passed in" do
      it "returns true" do
        expect(
          described_class.new(
            behaviour,
            10,
          ).match?(line_item)
        ).to be(true)
      end
    end
  end
end
