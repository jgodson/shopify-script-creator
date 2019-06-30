class Campaign
  def initialize(condition, *qualifiers)
    @condition = (condition.to_s + '?').to_sym
    @qualifiers = qualifiers.compact
    @line_item_selector = qualifiers.last unless @line_item_selector
  end

  def qualifies?(cart)
    return true if @qualifiers.empty?
    @qualifiers.send(@condition) do |qualifier|
      is_selector = false
      if qualifier.is_a?(Selector) || qualifier.instance_variable_get(:@conditions).any? { |q| q.is_a?(Selector) }
        is_selector = true
      end rescue nil
      if is_selector
        cart.line_items.send(@li_match_type) { |item| qualifier.match?(item) }
      else
        qualifier.match?(cart, @line_item_selector)
      end
    end
  end

  def run_with_hooks(cart)
    before_run(cart) if respond_to?(:before_run)
    run(cart)
    after_run(cart)
  end

  def after_run(cart)
    @discount.apply_final_discount if @discount && @discount.respond_to?(:apply_final_discount)
  end
end
