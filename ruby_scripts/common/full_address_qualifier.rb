class FullAddressQualifier
  def initialize(addresses)
    @addresses = addresses
  end

  def match?(cart, selector = nil)
    return false if cart.shipping_address.nil?

    @addresses.any? do |accepted_address|
      match_type = accepted_address[:match_type].to_sym

      cart.shipping_address.to_hash.all? do |key, value|
        key = key.to_sym
        value.downcase!

        next true unless accepted_address[key]
        next true if accepted_address[key].length === 0

        match = accepted_address[key].any? do |potential_address|
          potential_address.downcase!

          case match_type
            when :partial
              value.include?(potential_address)
            when :exact
              potential_address == value
          end
        end

        match
      end
    end
  end
end
