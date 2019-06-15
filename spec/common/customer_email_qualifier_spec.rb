require "./ruby_scripts/common/customer_email_qualifier"

RSpec.describe CustomerEmailQualifier, "#match?" do
  let(:customer) { nil }
  let!(:cart) { create(:cart, customer: customer) }
  let(:emails) { ["test@shopify.com"] }

  describe "with no customer" do
    it "returns false" do
      expect(
        described_class.new(
          :does,
          :match,
          emails,
        ).match?(cart)
      ).to be(false)
    end
  end

  describe "with a customer with no email" do
    let(:customer) { create(:customer) }

    it "returns false when using :match" do
      expect(
        described_class.new(
          :does,
          :match,
          emails,
        ).match?(cart)
      ).to be(false)
    end

    it "returns false when using :include" do
      expect(
        described_class.new(
          :does,
          :include,
          emails,
        ).match?(cart)
      ).to be(false)
    end
  end

  describe "with a customer with an email" do
    let(:customer) { create(:customer, email: emails.first) }

    describe "match" do
      it "returns false when email does not match" do
        expect(
          described_class.new(
            :does,
            :match,
            ['test2@shopify.com'],
          ).match?(cart)
        ).to be(false)
      end

      it "returns true when email does match" do
        expect(
          described_class.new(
            :does,
            :match,
            emails,
          ).match?(cart)
        ).to be(true)
      end

      it "using :does_not applies opposite behaviour" do
        expect(
          described_class.new(
            :does_not,
            :match,
            emails,
          ).match?(cart)
        ).to be(false)
      end
    end

    describe "include" do
      it "returns false when email does not include anything passed in" do
        expect(
          described_class.new(
            :does,
            :include,
            ['@somethingelse.com'],
          ).match?(cart)
        ).to be(false)
      end

      it "returns true when email does include something passed in" do
        expect(
          described_class.new(
            :does,
            :include,
            ['@shopify.com'],
          ).match?(cart)
        ).to be(true)
      end

      it "using :does_not applies opposite behaviour" do
        expect(
          described_class.new(
            :does_not,
            :include,
            ['@shopify.com'],
          ).match?(cart)
        ).to be(false)
      end
    end

  end
end
