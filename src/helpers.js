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

export {
  capitalize,
  splitAndCapitalize,
  splitCamelCase
}