class LineItemPropertiesSelector < Selector
  def initialize(target_properties)
    @target_properties = target_properties
  end

  def match?(line_item)
    line_item_props = line_item.properties
    @target_properties.all? do |key, value|
      next unless line_item_props.has_key?(key)
      true if line_item_props[key].downcase == value.downcase
    end
  end
end
