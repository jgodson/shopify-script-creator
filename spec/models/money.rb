class Money
  attr_reader :cents

  class << self
    def zero
      self.new(cents: 0)
    end
  end

  def initialize(cents:)
    @cents = cents.to_i
  end

  def to_s
    sprintf "#<Money:$%.2f>" % (cents / 100).round(2)
  end

  def *(number)
    Money.new(cents: @cents * number)
  end

  def +(money)
    Money.new(cents: @cents + money.cents)
  end

  def -(money)
    Money.new(cents: @cents - money.cents)
  end

  def <(money)
    @cents < money.cents
  end

  def <=(money)
    @cents <= money.cents
  end

  def >(money)
    @cents > money.cents
  end

  def >=(money)
    @cents >= money.cents
  end

  def ==(money)
    @cents == money.cents
  end
end
