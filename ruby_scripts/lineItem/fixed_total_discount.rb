class FixedTotalDiscount
  def initialize(amount, message, behaviour = :to_zero)
    @amount = Money.new(cents: amount * 100)
    @message = message
    @discount_applied = Money.zero
    @all_items = []
    @is_split = behaviour == :split
  end

  def apply(line_item)
    if @is_split
      @all_items << line_item
    else
      return unless @discount_applied < @amount
      discount_to_apply = [(@amount - @discount_applied), line_item.line_price].min
      line_item.change_line_price(line_item.line_price - discount_to_apply, {message: @message})
      @discount_applied += discount_to_apply
    end
  end

  def apply_final_discount
    return if @all_items.length == 0
    total_items = @all_items.length
    total_quantity = 0
    total_cost = Money.zero
    @all_items.each do |item|
      total_quantity += item.quantity
      total_cost += item.line_price
    end
    @all_items.each_with_index do |item, index|
      discount_percent = item.line_price.cents / total_cost.cents
      if total_items == index + 1
        discount_to_apply = Money.new(cents: @amount.cents - @discount_applied.cents.floor)
      else
        discount_to_apply = Money.new(cents: @amount.cents * discount_percent)
      end
      item.change_line_price(item.line_price - discount_to_apply, {message: @message})
      @discount_applied += discount_to_apply
    end
  end
end
