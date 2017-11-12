
  function capitalize(word) {
    return word[0].toUpperCase() + word.substring(1);
  }

  function splitAndCapitalize(splitOn, words) {
    words = words.split(splitOn);
    words[0] = capitalize(words[0]);
    return words.join(' ');
  }

  function splitCamelCase(word) {
    const isCapital = /[A-Z]/;
    const seperator = " ";
    let isFirstCapital = true;
    const newWord = [];
    word = word.split('');
    for (const index in word) {
      const letter = word[index];
      if (isCapital.test(letter)) {
        if (!isFirstCapital) {
          newWord.push(seperator + letter);
        } else {
          isFirstCapital = false;
          newWord.push(letter);
        }
      } else {
        newWord.push(letter);
      }
    }
    return newWord.join('');
  }

  function isCampaignSelect(inputName) {
    if (inputName.indexOf('campaignSelect') === -1) { return false; }
    const temparr = inputName.split('-');
    return temparr.length > 1 && temparr[1].split('_')[0] === temparr[temparr.length - 1].split('_')[0];
  }

  function getInputType(inputName) {
    const type = inputName.split('-');
    return type[type.length - 1].split('_')[0];
  }

export {
  capitalize,
  splitAndCapitalize,
  splitCamelCase,
  isCampaignSelect,
  getInputType
}