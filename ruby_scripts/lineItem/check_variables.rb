class CheckVariables < Qualifier
  def initialize(variables)
    @variables = variables
  end

  def match?(cart, selector = nil)
    @variables.all? { |var| VARIABLES[var[:name]] == var[:value] }
  end
end
