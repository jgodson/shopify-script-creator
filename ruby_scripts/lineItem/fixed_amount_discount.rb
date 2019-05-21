class FixedAmountDiscount
  def initialize(price, message)
    @price = Money.new(cents: 100) * price
    @message = message
    @all_items = []
  end

  def apply(line_item)
    @all_items << line_item
  end

  def apply_final_discount
    return if @all_items.length == 0
    total_items = 0
    total_quantity = 0
    total_cost = Money.zero
    @all_items.each do |item|
      total_items += 1
      total_quantity += item.quantity
      total_cost += item.line_price
    end
    amount = total_cost - @price
    discount_applied = Money.zero

    @all_items.each_with_index do |item, index|
      discount_percent = item.line_price.cents / total_cost.cents
      if total_items == index + 1
        discount_to_apply = amount - discount_applied
      else
        discount_to_apply = amount * discount_percent
      end
      item.change_line_price(item.line_price - discount_to_apply, {message: @message})
      discount_applied += discount_to_apply
    end
  end
end
