require "./ruby_scripts/payment/all_gateways_selector"

RSpec.describe AllGatewaysSelector, "#match?" do
  let(:gateway1) { create(:gateway) }
  let(:gateway2) { create(:gateway, :gateway2) }
  let(:gateway3) { create(:gateway, :gateway3) }

  context "given 3 gateways" do
    let(:gateways) { [gateway1, gateway2, gateway3] }

    it "matches them all" do
      gateways.each do |gateway|
        expect(AllGatewaysSelector.new.match?(gateway)).to be(true)
      end
    end
  end
end
