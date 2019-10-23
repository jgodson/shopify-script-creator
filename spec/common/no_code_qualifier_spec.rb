require "./ruby_scripts/common/no_code_qualifier"

RSpec.describe NoCodeQualifier, "#match?" do
  let(:line_items) {[
    create(:line_item, variant: create(:variant, id: 123)),
    create(:line_item, variant: create(:variant, :mid_priced), quantity: 3)
  ]}

  describe "with no discount code" do
    let(:cart) { create(:cart, line_items: line_items) }

    it "matches" do
      expect(
        described_class.new().match?(cart)
      ).to be(true)
    end
  end

  describe "with a discount code" do
    let(:cart) { create(:cart, :with_fixed_discount, line_items: line_items) }

    it "does not match with a discount code" do
      expect(
        described_class.new().match?(cart)
      ).to be(false)
    end
  end
end
