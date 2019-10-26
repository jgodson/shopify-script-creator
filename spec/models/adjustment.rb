class Adjustment
  attr_reader :property, :old_value, :new_value, :message

  def initialize(property:, old_value:, new_value:, message:)
    @property = property
    @old_value = old_value
    @new_value = new_value
    @message = message
  end
end
