require "./ruby_scripts/shipping/rate_price_selector"

RSpec.describe RatePriceSelector, "#match?" do
  let(:shipping_rate) { create(:shipping_rate, price: Money.new(cents: 10_00)) }

  context "using greater_than" do
    it "matches when the price is more than the amount specified" do
      expect(
        described_class.new(
          :greater_than,
          9
        ).match?(shipping_rate)
      ).to be(true)
    end

    it "does not match when the price is equal to the amount specified" do
      expect(
        described_class.new(
          :greater_than,
          10
        ).match?(shipping_rate)
      ).to be(false)
    end

    it "does not match when the price is less than the amount specified" do
      expect(
        described_class.new(
          :greater_than,
          11
        ).match?(shipping_rate)
      ).to be(false)
    end
  end

  context "using greater_than_or_equal" do
    it "matches when the price is more than the amount specified" do
      expect(
        described_class.new(
          :greater_than_or_equal,
          9
        ).match?(shipping_rate)
      ).to be(true)
    end

    it "matches when the price is equal to the amount specified" do
      expect(
        described_class.new(
          :greater_than_or_equal,
          10
        ).match?(shipping_rate)
      ).to be(true)
    end

    it "does not match when the price is less than the amount specified" do
      expect(
        described_class.new(
          :greater_than_or_equal,
          11
        ).match?(shipping_rate)
      ).to be(false)
    end
  end

  context "using less_than" do
    it "matches when the price is less than the amount specified" do
      expect(
        described_class.new(
          :less_than,
          11
        ).match?(shipping_rate)
      ).to be(true)
    end

    it "matches when the price is equal to the amount specified" do
      expect(
        described_class.new(
          :less_than,
          10
        ).match?(shipping_rate)
      ).to be(false)
    end

    it "does not match when the price is less than the amount specified" do
      expect(
        described_class.new(
          :less_than,
          9
        ).match?(shipping_rate)
      ).to be(false)
    end
  end

  context "using less_than_or_equal" do
    it "matches when the price is more than the amount specified" do
      expect(
        described_class.new(
          :less_than_or_equal,
          9
        ).match?(shipping_rate)
      ).to be(false)
    end

    it "matches when the price is equal to the amount specified" do
      expect(
        described_class.new(
          :less_than_or_equal,
          10
        ).match?(shipping_rate)
      ).to be(true)
    end

    it "does not match when the price is less than the amount specified" do
      expect(
        described_class.new(
          :less_than_or_equal,
          11
        ).match?(shipping_rate)
      ).to be(true)
    end
  end

  context "using equal_to" do
    it "does not match when the price is more than the amount specified" do
      expect(
        described_class.new(
          :equal_to,
          9
        ).match?(shipping_rate)
      ).to be(false)
    end

    it "matches when the price is equal to the amount specified" do
      expect(
        described_class.new(
          :equal_to,
          10
        ).match?(shipping_rate)
      ).to be(true)
    end

    it "does not match when the price is less than the amount specified" do
      expect(
        described_class.new(
          :equal_to,
          11
        ).match?(shipping_rate)
      ).to be(false)
    end
  end

  context "handles decimal numbers" do
    let(:shipping_rate) { create(:shipping_rate, price: Money.new(cents: 10_05)) }

    it "matches when decimals are used" do
      expect(
        described_class.new(
          :equal_to,
          10.05
        ).match?(shipping_rate)
      ).to be(true)
    end
  end
end
