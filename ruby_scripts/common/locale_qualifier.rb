class LocaleQualifier < Qualifier
  def initialize(match_type, match_condition, locales)
    @match_condition = match_condition
    @invert = match_type == :does_not
    @locales = locales
  end

  def match?(_, _ = nil)
    locale = Input.locale.to_s
    if @match_condition === :match
      return @invert ^ @locales.include?(locale)
    else
      return @invert ^ partial_match(@match_condition, locale, @locales)
    end
  end
end
