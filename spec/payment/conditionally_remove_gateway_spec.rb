require "./ruby_scripts/payment/conditionally_remove_gateway"

RSpec.describe ConditionallyRemoveGateway, "#run" do
  let(:gateway1) { create(:gateway) }
  let(:gateway2) { create(:gateway, :gateway2) }
  let(:gateways) { [gateway1, gateway2] }
  let(:cart) { create(:cart) }

  describe "with two gateways available" do
    before {
      ConditionallyRemoveGateway.new(
        :all,
        nil,
        nil,
        :any,
        nil,
        TestHelper::GatewayNameMatcher.new("Gateway1"),
      ).run(gateways, cart)
    }

    it "removes the first gateway" do
      expect(gateways.length).to eq(1)
      expect(gateways).not_to include(gateway1)
    end

    it "does not remove the second gateway" do
      expect(gateways.length).to eq(1)
      expect(gateways).to include(gateway2)
    end
  end

  describe "when the cart does not qualify" do
    before { ConditionallyRemoveGateway.new(
      :all,
      TestHelper::NeverQualifier.new,
      nil,
      :any,
      nil,
      TestHelper::GatewayNameMatcher.new("Gateway1"),
      ).run(gateways, cart)
    }

    it "does not remove either gateway" do
      expect(gateways.length).to eq(2)
    end
  end

  describe "when a gateway selector isn't provided" do
    before { ConditionallyRemoveGateway.new(:all, nil, nil, :any, nil, nil).run(gateways, cart) }

    it "does not remove either gateway" do
      expect(gateways.length).to eq(2)
    end
  end
end
