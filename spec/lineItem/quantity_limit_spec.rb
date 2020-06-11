require "./ruby_scripts/lineItem/quantity_limit"

RSpec.describe QuantityLimit, "#run" do
  let(:product1) {create(:product, id: 1)}
  let(:product2) {create(:product, id: 2)}
  let(:line_items) {[
    create(:line_item, variant: create(:variant, id: 1, product: product1), quantity: 2),
    create(:line_item, variant: create(:variant, id: 2, product: product1), quantity: 2),
    create(:line_item, variant: create(:variant, id: 3, product: product2), quantity: 3)
  ]}
  let(:cart) { create(:cart, line_items: line_items) }
  let(:original_cart) { cart.dup }
  before do
    original_cart.line_items = cart.line_items.map(&:dup)
  end

  it "removes all items when limit is 0 and no selector is given" do
    described_class.new(
      :all,
      nil,
      nil,
      nil,
      :product,
      0,
    ).run(cart)

    expect(TestHelper::Cart.get_total_quantity(cart.line_items)).to eq(0)
  end

  describe "limit_by :product" do
    let(:behaviour) { :product }

    describe "with a matching product" do
      let(:selector) { TestHelper::ProductIdMatcher.new(1) }

      it "limits the quantity" do
        described_class.new(
          :all,
          nil,
          nil,
          selector,
          behaviour,
          1,
        ).run(cart)

        expect(TestHelper::Cart.get_total_quantity(cart.line_items)).to eq(4)
        expect(cart.line_items[0].quantity).to eq(original_cart.line_items[0].quantity - 1)
        # Second item was removed
        expect(cart.line_items[1].quantity).to eq(original_cart.line_items[2].quantity)
      end
    end

    describe "with no matching product" do
      let(:selector) { TestHelper::ProductIdMatcher.new(4) }

      it "does not limit the quantity" do
        described_class.new(
          :all,
          nil,
          nil,
          selector,
          behaviour,
          1,
        ).run(cart)

        expect(TestHelper::Cart.get_total_quantity(cart.line_items)).to eq(TestHelper::Cart.get_total_quantity(original_cart.line_items))
      end
    end
  end

  describe "limit_by :variant" do
    let(:behaviour) { :variant }

    describe "with a matching variant" do
      let(:selector) { TestHelper::VariantIdMatcher.new(1) }

      it "limits the quantity" do
        described_class.new(
          :all,
          nil,
          nil,
          selector,
          behaviour,
          1,
        ).run(cart)

        expect(TestHelper::Cart.get_total_quantity(cart.line_items)).to eq(6)
        expect(cart.line_items[0].quantity).to eq(original_cart.line_items[0].quantity - 1)
        expect(cart.line_items[1].quantity).to eq(original_cart.line_items[1].quantity)
        expect(cart.line_items[2].quantity).to eq(original_cart.line_items[2].quantity)
      end
    end

    describe "with no matching variant" do
      let(:selector) { TestHelper::VariantIdMatcher.new(4) }

      it "does not limit the quantity" do
        described_class.new(
          :all,
          nil,
          nil,
          selector,
          behaviour,
          1,
        ).run(cart)

        expect(TestHelper::Cart.get_total_quantity(cart.line_items)).to eq(TestHelper::Cart.get_total_quantity(original_cart.line_items))
      end
    end
  end

  describe "limit_by :cart" do
    let(:behaviour) { :cart }

    describe "with a matching product" do
      let(:selector) { TestHelper::ProductIdMatcher.new(1) }

      it "limits the quantity" do
        described_class.new(
          :all,
          nil,
          nil,
          selector,
          behaviour,
          2,
        ).run(cart)

        expect(TestHelper::Cart.get_total_quantity(cart.line_items)).to eq(5)
        expect(cart.line_items[0].quantity).to eq(original_cart.line_items[0].quantity)
        # Second item was removed
        expect(cart.line_items[1].quantity).to eq(original_cart.line_items[2].quantity)
      end
    end

    describe "with no matching product" do
      let(:selector) { TestHelper::ProductIdMatcher.new(4) }

      it "does not limit the quantity" do
        described_class.new(
          :all,
          nil,
          nil,
          selector,
          behaviour,
          2,
        ).run(cart)

        expect(TestHelper::Cart.get_total_quantity(cart.line_items)).to eq(TestHelper::Cart.get_total_quantity(original_cart.line_items))
      end
    end

    describe "without a selector" do
      it "limits the quantity" do
        described_class.new(
          :all,
          nil,
          nil,
          nil,
          behaviour,
          3,
        ).run(cart)

        expect(TestHelper::Cart.get_total_quantity(cart.line_items)).to eq(3)
        expect(cart.line_items[0].quantity).to eq(original_cart.line_items[0].quantity)
        expect(cart.line_items[1].quantity).to eq(original_cart.line_items[1].quantity - 1)
        # Last item was removed
      end
    end

  end
end
