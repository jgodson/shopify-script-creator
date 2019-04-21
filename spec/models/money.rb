class Money
  attr_reader :cents

  class << self
    def zero
      self.new({cents: 0})
    end
  end

  def initialize(cents:)
    @cents = cents.to_f
  end

  def to_s
    sprintf "$%.2f" % (cents / 100).round(2)
  end
end
