class Gateway
  attr_accessor :name, :enabled_card_brands

  def change_name(new_name)
    @name = new_name
  end
end
