class CartQuantityQualifier < Qualifier
  def initialize(total_method, comparison_type, quantity)
    @total_method = total_method
    @comparison_type = comparison_type
    @quantity = quantity
  end

  def match?(cart, selector = nil)
    case @total_method
      when :item
        total = cart.line_items.reduce(0) do |total, item|
          total + ((selector ? selector.match?(item) : true) ? item.quantity : 0)
        end
      when :cart
        total = cart.line_items.reduce(0) { |total, item| total + item.quantity }
    end
    if @total_method == :line_any || @total_method == :line_all
      method = @total_method == :line_any ? :any? : :all?
      qualified_items = cart.line_items.select { |item| selector ? selector.match?(item) : true }
      qualified_items.send(method) { |item| compare_amounts(item.quantity, @comparison_type, @quantity) }
    else
      compare_amounts(total, @comparison_type, @quantity)
    end
  end
end
