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

  function getObjectFormats(campaignName, inputs) {
    let targetInput = null;
    const keys = Object.keys(inputs);
    for (let index = 0, length = keys.length; index < length; index++) {
      const key = keys[index];
      const foundInput = inputs[key].filter((input) => input.value === campaignName);
      if (foundInput.length > 0) {
        targetInput = foundInput[0];
        break;
      }
    }
    const targetObjectInput = targetInput.inputs[Object.keys(targetInput.inputs).pop()];
    return [targetObjectInput.inputFormat, targetObjectInput.outputFormat];
  }

  function formatObject(inOut, value, inputFmt, outputFmt) {
    if (inOut == 'input') {

    } else {

    }
  }

export {
  capitalize,
  splitAndCapitalize,
  splitCamelCase,
  isCampaignSelect,
  getInputType,
  getObjectFormats,
  formatObject
}