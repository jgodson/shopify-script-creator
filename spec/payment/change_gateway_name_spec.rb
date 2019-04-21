require "./ruby_scripts/payment/change_gateway_name"

class NameMatcher
  def initialize(name)
    @name = name
  end

  def match?(gateway)
    @name == gateway.name
  end
end

RSpec.describe ChangeGatewayName, "#run" do
  let(:gateway1) { create(:gateway) }
  let(:gateway2) { create(:gateway, :gateway2) }
  let(:gateways) { [gateway1, gateway2] }
  let(:cart) { create(:cart) }

  describe "with two gateways available" do
    before { ChangeGatewayName.new(:all, nil, nil, :any, nil, NameMatcher.new("Gateway1"), "Test").run(gateways, cart) }

    it "changes the name of the first gateway" do
      expect(gateway1.name).to eq("Test")
    end

    it "does not change the name of the second gateway" do
      expect(gateway2.name).to eq("Gateway2")
    end
  end

  describe "when the cart does not qualify" do
    before { ChangeGatewayName.new(
      :all,
      TestHelper::NeverQualifier.new,
      nil,
      :any,
      nil,
      NameMatcher.new("Gateway1"),
      "Test"
      ).run(gateways, cart)
    }

    it "does not change the name of either gateway" do
      expect(gateway1.name).to eq("Gateway1")
      expect(gateway2.name).to eq("Gateway2")
    end
  end

  describe "when a gateway selector isn't provided" do
    before { ChangeGatewayName.new(:all, nil, nil, :any, nil, nil, "Test").run(gateways, cart) }

    it "does not change the name of either gateway" do
      expect(gateway1.name).to eq("Gateway1")
      expect(gateway2.name).to eq("Gateway2")
    end
  end
end
