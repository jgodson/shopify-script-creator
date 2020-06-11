require "./ruby_scripts/common/zip_code_qualifier"

RSpec.describe ZipCodeQualifier, "#match?" do
  let(:shipping_zip) { nil }
  let(:shipping_address) { create(:shipping_address, zip: shipping_zip) }
  let(:cart) { create(:cart, shipping_address: shipping_address) }
  let(:match_type) { :does }
  let(:match_condition) { :match }
  let(:zip_input) { ["12345"] }

  describe "with no zip code" do
    it "does not match" do
      expect(
        described_class.new(
          match_type,
          match_condition,
          zip_input
        ).match?(cart)
      ).to be(false)
    end
  end

  describe "with a zip code entered" do
    let(:shipping_zip) { "12345" }

    it "matches when given the same zip as the cart" do
      expect(
        described_class.new(
          match_type,
          match_condition,
          zip_input
        ).match?(cart)
      ).to be(true)
    end

    it "inverts behaviour when gives does_not match type" do
      expect(
        described_class.new(
          :does_not,
          match_condition,
          zip_input
        ).match?(cart)
      ).to be(false)
    end

    it "does not match when given a different zip as the cart" do
      expect(
        described_class.new(
          match_type,
          match_condition,
          ["23456"]
        ).match?(cart)
      ).to be(false)
    end

    context "when letters and spaces are in the zip" do
      let(:shipping_zip) { "ABC 123" }
      let(:zip_input) { ["abc 123"] }

      it "ignores case" do
        expect(
          described_class.new(
            match_type,
            match_condition,
            zip_input
          ).match?(cart)
        ).to be(true)
      end

      it "ignores spaces" do
        expect(
          described_class.new(
            match_type,
            match_condition,
            ["abc123"]
          ).match?(cart)
        ).to be(true)
      end
    end
  end
end
