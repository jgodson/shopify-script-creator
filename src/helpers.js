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
    const keys = Object.keys(inputs);
    // Default to the last input in the array
    let targetInput = inputs[keys[keys.length - 1]];

    for (let index = 0, length = keys.length; index < length; index++) {
      const key = keys[index];
      if (!Array.isArray(inputs[key])) { break; }
      const foundInput = inputs[key].filter((input) => input.value === campaignName);
      if (foundInput.length > 0) {
        targetInput = foundInput[0];
        break;
      }
    }

    let targetObjectInput = null;
    if (targetInput.inputs) {
      targetObjectInput = targetInput.inputs[Object.keys(targetInput.inputs).pop()];
    } else {
      targetObjectInput = targetInput;
    }
    return [targetObjectInput.inputFormat, targetObjectInput.outputFormat];
  }

  function formatObject(inOut, value, inputFmt, outputFmt) {
    if (inOut == 'input') {
      // Remove {}
      value = value.substring(value.length - 1, 0).substring(1);
      if (value === "") { return value; }

      const lines = value.split('\n').map((line) => {
        const values = line.split('=>').map((value) => value.trim());
        let output = inputFmt;
        for (let index = 0; index < values.length; index++) {
          const type = output.match(/{\w+:(\w+)}/)[1];
          if (type === "text") {
            // Remove "" around text
            values[index] = values[index].replace(',', '');
            values[index] = values[index].substring(values[index].length - 1, 0).substring(1);
          } else {
            values[index] = values[index].split(',').map((value) => {
              // Replace any [] found
              value = value.replace(/[\[\]]/g, '');
              // Removes "" around each value in the array
              value = value.substring(value.length - 1, 0).substring(1);
              return value.trim();
            });
            values[index] = values[index].filter((value) => value !== "").join(', ');
          }
          output = output.replace(/{\w+:(\w+)}/i, values[index]);
        }
        return output;
      }).join('\n');
      return lines;
    } else {
      const inputFormatRepl = inputFmt.replace(/{\w+:(\w+)}/gi, '').trim();
      const splitter = inputFormatRepl[0];
      const requiredInputs = inputFormatRepl.split(splitter).length;
      const lines = value.split('\n').map((line) => {
        const values = line.split(splitter).map((value) => value.trim());
        if (values.length !== requiredInputs) {
          throw Error("Number of inputs does not match required input format");
        }
        let output = outputFmt;
        for (let index = 0; index < values.length; index++) {
          const type = output.match(/{(\w+)}/)[1];
          if (type === 'array') {
            // Add "" around each value in the array
            values[index] = values[index].split(',').map((value) => `"${value.trim()}"`);
            values[index] = values[index].filter((value) => value !== '""').join();
          }
          output = output.replace(/{\w+}/i, values[index]);
        }
        return output;
      }).join(',\n');
      return `{${lines}}`;
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