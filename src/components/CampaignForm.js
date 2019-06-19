import React, { Component } from 'react';
import {
  Layout,
  Card,
  FormLayout,
  TextField,
  Checkbox,
  TextStyle,
  Select,
  Stack,
  Button,
  Tag
} from '@shopify/polaris';
import CardList from './CardList';

import styles from './CampaignForm.css';

import {
  capitalize,
  splitAndCapitalize,
  splitCamelCase,
  isCampaignSelect,
  getInputType,
  getObjectFormats,
  formatObject
} from '../helpers';

export default class CampaignForm extends Component {
  constructor(props) {
    super(props);

    this.blankInputState = {
      campaignSelect: {},
      campaignLabel: "",
      select: {},
      text: {},
      number: {},
      array: {},
      object: {},
      objectArray: {},
      boolean: {},
    }

    this.state = {
      inputs: JSON.parse(JSON.stringify(this.blankInputState)),
      isActive: true,
    }

    this.mainCampaignName = 'mainCampaign';

    this.inputMap = {};
    this.defaults = {};
    this.updateCount = 0;

    this.handleInputChange = this.handleInputChange.bind(this);
    this.hideForm = this.hideForm.bind(this);
    this.buildAndAddCampaign = this.buildAndAddCampaign.bind(this);
    this.getInputValue = this.getInputValue.bind(this);
    this.populateBasedOnExistingInfo = this.populateBasedOnExistingInfo.bind(this);
    this.getInputsForCampaign = this.getInputsForCampaign.bind(this);
    this.renderForm = this.renderForm.bind(this);
    this.generateModalInputs = this.generateModalInputs.bind(this);
    this.handleModalReturn = this.handleModalReturn.bind(this);
    this.toggleActive = this.toggleActive.bind(this);
  }

  componentDidMount() {
    if (this.props.existingInfo) {
      this.populateBasedOnExistingInfo(this.props.existingInfo);
    }
  }

  componentWillReceiveProps(newProps) {
    if (this.props.existingInfo) {
      if (this.props.existingInfo.id !== newProps.existingInfo.id) {
        // Reset update count so we can populate the new information
        this.updateCount = 0;
        this.populateBasedOnExistingInfo(newProps.existingInfo);
      } else if (newProps.existingInfo.active !== this.state.isActive) {
        this.setState({isActive: newProps.existingInfo.active});
      }
    }
  }

  componentDidUpdate() {
    if (this.props.existingInfo && this.updateCount < 4) {
      this.populateBasedOnExistingInfo(this.props.existingInfo);
    }
  }

  handleInputChange(newVal, type, name) {
    const newState = this.state;
    // Clear child inputs from state if a campaignSelect was changed
    if (type === 'campaignSelect') {
      Object.keys(newState.inputs).forEach((inputType) => {
        Object.keys(newState.inputs[inputType]).forEach((inputName) => {
          if (inputName.startsWith(name)) {
            delete newState.inputs[inputType][inputName];
          }
        });
      });
    }
    if (type && name) {
      newState.inputs[type][name] = newVal;
    } else {
      newState.inputs.campaignLabel = newVal;
    }
    this.setState(newState);
  }

  toggleActive() {
    this.setState({isActive: !this.state.isActive});
  }

  populateBasedOnExistingInfo(existingInfo) {
    if (!existingInfo) { return; }
    const newState = this.state;
    newState.isActive = existingInfo.active === false ? false : true;
    const mainInputs = existingInfo.inputs;
    const updateCount = this.updateCount;
    const inputMap = this.inputMap;
    const mainCampaignName = this.mainCampaignName;
    const campaignInputs = this.props.currentCampaign.inputs;
    if (updateCount === 0) {
      newState.inputs = JSON.parse(JSON.stringify(this.blankInputState));
      newState.inputs.campaignLabel = existingInfo.label
    }
    setValuesForInputs(mainInputs);
    this.updateCount++;
    this.setState(newState);

    function setValuesForInputs(inputs) {
      if (!inputs) { return; }
      inputs.forEach((input, inputIndex) => {
        switch (updateCount) {
          case 0:
            // Pick the first set of campaigns
            if (typeof input === "object") {
              newState.inputs.campaignSelect[`${mainCampaignName}-campaignSelect_${inputIndex}`] = input.name || input;
            }
            break;
          case 1:
            // Pick the second set of campaigns (if there is any)
            if (Array.isArray(input.inputs) && inputs.some((input) => input instanceof Object)) {
              input.inputs.forEach((secondInput, secondIndex) => {
                newState.inputs.campaignSelect[`${mainCampaignName}-campaignSelect_${inputIndex}-campaignSelect_${secondIndex}`] = secondInput.name;
              });
            }
            break;
          case 2:
            // Pick the third set of campaigns (if there is any)
            if (Array.isArray(input.inputs) && inputs.some((input) => input instanceof Object)) {
              input.inputs.forEach((secondInput, secondIndex) => {
                if (Array.isArray(secondInput.inputs) && secondInput.inputs.some((input) => input instanceof Object)) {
                  secondInput.inputs.forEach((thirdInput, thirdIndex) => {
                    if (typeof thirdInput === "object") {
                      newState.inputs.campaignSelect[`${mainCampaignName}-campaignSelect_${inputIndex}-campaignSelect_${secondIndex}-campaignSelect_${thirdIndex}`] = thirdInput.name;
                    }
                  });
                }
              });
            }
            break;
          default:
            // Set the values
            inputMap[mainCampaignName].forEach((inputName, index) => {
              let inputCampaign = null;
              if (inputIndex === index) {
                if (isCampaignSelect(inputName)) {
                  let fields = inputMap[inputName];
                  if (Array.isArray(fields)) {
                    fields.forEach((fieldName, fieldIndex) => {
                      if (!isCampaignSelect(fieldName)) {
                        const type = getInputType(fieldName);
                        const value = input.inputs[fieldIndex];
                        if (type === 'object' || type === 'objectArray') {
                          inputCampaign = newState.inputs.campaignSelect[inputName];
                        }
                        newState.inputs[type][fieldName] = convertInput(value, type, inputCampaign, campaignInputs);
                      } else {
                        const nestedFields = inputMap[fieldName];
                        if (!nestedFields || nestedFields === 'none') { return; }
                        nestedFields.forEach((nestedName, nestedIndex) => {
                          if (!isCampaignSelect(nestedName)) {
                            const type = getInputType(nestedName);
                            const value = input.inputs[fieldIndex].inputs[nestedIndex];
                            if (type === 'object' || type === 'objectArray') {
                              inputCampaign = newState.inputs.campaignSelect[fieldName];
                            }
                            newState.inputs[type][nestedName] = convertInput(value, type, inputCampaign, campaignInputs);
                          } else {
                            const finalFields = inputMap[nestedName];
                            if (!finalFields || finalFields === 'none') { return; }
                            finalFields.forEach((finalName, finalIndex) => {
                              const type = getInputType(finalName);
                              const value = input.inputs[fieldIndex].inputs[nestedIndex].inputs[finalIndex];
                              if (type === 'object' || type === 'objectArray') {
                                inputCampaign = newState.inputs.campaignSelect[nestedName];
                              }
                              newState.inputs[type][finalName] = convertInput(value, type, inputCampaign, campaignInputs);
                            });
                          }
                        });
                      }
                    });
                  }
                } else {
                  const type = getInputType(inputName);
                  const value = input;
                  newState.inputs[type][inputName] = convertInput(value, type, inputCampaign, campaignInputs);
                }
              }
            });
          break;
        }
      });

      function convertInput(value, type, campaignName, campaignInputs) {
        if (value === undefined) {
          return "";
        }

        switch (type) {
          case 'array':
            // Remove []. Then split on comma, remove "" and join with comma
            value = value.substring(value.length - 1, 0).substring(1).split(',')
            return value.map((entry) => {
              entry = entry.trim();
              return entry.substring(entry.length - 1, 0).substring(1);
            }).join(', ');
          case 'text':
            // Remove quotes
            return value.substring(value.length - 1, 0).substring(1);
          case 'select':
            // Remove :
            return value.substring(1);
          case 'object':
          case 'objectArray':
            const [inputFormat, outputFormat] = getObjectFormats(campaignName, campaignInputs);
            return formatObject('input', value, inputFormat, outputFormat);
          default:
            return value;
        }
      }
    }
  }

  generateAdditionalInputs(campaign, mapTo) {
    if (campaign.inputs[Object.keys(campaign.inputs)[0]].type && !campaign.newLineEachInput) {
      return (
        <div className="input-container">
          <FormLayout>
            <FormLayout.Group>
              {this.generateInputsForCampaign(campaign, mapTo)}
            </FormLayout.Group>
          </FormLayout>
        </div>
      );
    } else if (campaign.newLineEachInput) {
      return (
        <div className="input-container__single-line">
          <FormLayout>
            {this.generateInputsForCampaign(campaign, mapTo)}
          </FormLayout>
        </div>
      );
    } else {
      return this.generateInputsForCampaign(campaign, mapTo);
    }
  }

  generateInputsForCampaign(campaign, mapTo) {
    const inputs = [];
    const fields = campaign.inputs;
    const campaignInputKeys = Object.keys(campaign.inputs);
    Object.keys(fields).forEach((key, index) => {
      const field = typeof fields[key] !== "object" ? fields[key] : fields[campaignInputKeys[index]];
      const inputType = field.type || 'campaignSelect';
      const inputId = inputs.length;
      const inputName = mapTo ? `${mapTo}-${inputType}_${inputId}` : `${inputType}_${inputId}`;
      const newInput = {
        type: inputType,
        pattern: field.inputPattern,
        label: key.indexOf('_') > -1 ? splitAndCapitalize('_', key) : capitalize(key),
        options: field.options || field,
        description: field.description,
        name: inputName,
      };
      const isMain = mapTo === this.mainCampaignName;
      inputs.push(this.inputGenerator(newInput, isMain));
      if (mapTo) {
        if (!this.inputMap[mapTo]) {
          this.inputMap[mapTo] = [inputName];
        } else {
          this.inputMap[mapTo].push(inputName);
        }
      }
    });
    return inputs;
  }

  inputGenerator(input, isMain) {
    const MODAL_ACTIONS = [
      {
        content: "Cancel",
        onClick: 'close'
      },
      {
        content: "Save",
        submit: true,
        primary: true
      }
    ];

    const INPUT_TYPES = {
      text: {
        generate: (input) => {
          return (
            <TextField
              label={input.label}
              key={input.name}
              name={input.name}
              helpText={input.description}
              value={this.state.inputs[input.type][input.name]}
              onChange={(val) => this.handleInputChange(val, input.type, input.name)}
            />
          );
        }
      },
      boolean: {
        generate: (input) => {
          return (
            <Checkbox
              label={input.label}
              key={input.name}
              name={input.name}
              helpText={input.description}
              checked={this.state.inputs[input.type][input.name] !== undefined ? this.state.inputs[input.type][input.name] : false}
              onChange={(val) => this.handleInputChange(val, input.type, input.name)}
            />
          );
        }
      },
      number: {
        generate: (input) => {
          return (
            <TextField
              label={input.label}
              key={input.name}
              name={input.name}
              min={0}
              type="number"
              helpText={input.description}
              value={this.state.inputs[input.type][input.name]}
              onChange={(val) => this.handleInputChange(Math.abs(val), input.type, input.name)}
            />
          );
        }
      },
      select: {
        generate: (input) => {
          this.defaults[input.name] = input.options[0].value;
          const helpText = <TextStyle variation="subdued">{input.description}</TextStyle>;
          return (
            <div key={input.name} className="select-wrapper">
              <Select
                label={input.label}
                options={input.options}
                name={input.name}
                value={this.state.inputs[input.type][input.name]}
                onChange={(val) => this.handleInputChange(val, input.type, input.name)}
              />
              {helpText}
            </div>
          );
        }
      },
      array: {
        generate: (input) => {
          const hasValues = !!this.state.inputs[input.type][input.name];
          const currentValues = hasValues ? this.state.inputs[input.type][input.name].split(',').map((val) => val.trim()) : '';
          return (
            <div className="TagContainer" key={input.name}>
              <Stack vertical>
                <Stack alignment="leading">
                  <Stack.Item fill>{input.label}</Stack.Item>
                  <Stack.Item>
                    <Button
                      plain
                      icon="circlePlus"
                      onClick={() => {
                        this.props.openModal({
                          title: input.label,
                          inputs: [{
                            name: input.name,
                            label: splitAndCapitalize('_', input.label),
                            type: "text",
                            value: "",
                            description: "Add several at once by separating each with a comma"
                          }],
                          onClose: (values) => this.handleModalReturn(values, input),
                          actions: MODAL_ACTIONS
                        })
                      }}
                    >
                      Add more
                    </Button>
                  </Stack.Item>
                </Stack>
                {hasValues ?
                  <Stack spacing="extraTight">
                    {currentValues.map((value, index) => {
                      return (
                        <Tag
                          key={`Tag_${index}`}
                          onRemove={(evt) => {
                            evt.preventDefault();
                            currentValues.splice(index, 1);
                            this.handleInputChange(currentValues.join(','), input.type, input.name);
                          }}
                        >
                          {value}
                        </Tag>
                      );
                    })}
                  </Stack>
                :
                  <Button
                    plain
                    fullWidth
                    onClick={() => {
                      this.props.openModal({
                        title: input.label,
                        inputs: [{
                          name: input.name,
                          label: splitAndCapitalize('_', input.label),
                          type: "text",
                          value: "",
                          description: "Add several at once by separating each with a comma"
                        }],
                        onClose: (values) => this.handleModalReturn(values, input),
                        actions: MODAL_ACTIONS
                      })
                    }}
                  >
                    Add {input.label.toLowerCase()}
                  </Button>
                }
                <TextStyle variation="subdued">{input.description}</TextStyle>
              </Stack>
            </div>
          );
        }
      },
      object: {
        generate: (input) => {
          const hasValues = !!this.state.inputs[input.type][input.name];
          const currentValues = hasValues ? this.state.inputs[input.type][input.name].split('\n') : '';
          return (
            <Stack vertical key={input.name}>
              <Stack alignment="center">
                <Stack.Item fill>{input.label}</Stack.Item>
                <Stack.Item>
                  <Button
                    plain
                    icon="circlePlus"
                    onClick={() => {
                      this.props.openModal({
                        title: input.label,
                        inputs: this.generateModalInputs(input),
                        onClose: (values) => this.handleModalReturn(values, input),
                        actions: MODAL_ACTIONS
                      })
                    }}
                  >
                    Add new
                  </Button>
                </Stack.Item>
              </Stack>
              {hasValues ?
                <CardList
                  headers={this.generateModalInputs(input).map((input) => input.label)}
                  items={currentValues.map((value, index) => {
                    return {
                      values: value.split(':'),
                      onEdit: () => {
                        this.props.openModal({
                        title: input.label,
                        inputs: this.generateModalInputs(input, currentValues[index]),
                        onClose: (values) => this.handleModalReturn(values, input, index),
                        actions: MODAL_ACTIONS
                        })
                      },
                      onRemove: () => {
                        currentValues.splice(index, 1);
                        this.handleInputChange(currentValues.join('\n'), input.type, input.name);
                      }
                    }
                  })}
                />
              :
                <Button
                  plain
                  fullWidth
                  onClick={() => {
                    this.props.openModal({
                      title: input.label,
                      inputs: this.generateModalInputs(input),
                      onClose: (values) => this.handleModalReturn(values, input),
                      actions: MODAL_ACTIONS
                    })
                  }}
                >
                  Add {input.label.toLowerCase()}
                </Button>
              }
                <TextStyle variation="subdued">{input.description}</TextStyle>
            </Stack>
          );
        }
      },
      objectArray: {
        generate: (input) => INPUT_TYPES.object.generate(input)
      },
      campaignSelect: {
        generate: (input) => {
          let value = this.state.inputs[input.type][input.name] || 'none';
          if (value && typeof value !== 'string') {
            value = value.name;
          }

          let descText = null;
          if (value === 'none') {
            descText = input.options.filter((option) => option.value === value)[0].description;
            this.inputMap[input.name] = 'none';
          }
          let description = value === 'none' ? <TextStyle variation="subdued"><strong>What it does: </strong>{descText}</TextStyle> : null;
          let additionalInputs = null;
          if (value && value !== 'none') {
            const campaign = input.options.filter((option) => option.value === value)[0];
            description = <TextStyle variation="subdued"><strong>What it does: </strong>{campaign.description}</TextStyle>;
            if (campaign.inputs) {
              additionalInputs = this.generateAdditionalInputs(campaign, input.name);
            }
          }
          return (
            <Card.Section key={input.name} title={input.label}>
              <div className="select-wrapper">
                <Select
                  options={input.options}
                  name={input.name}
                  value={value}
                  onChange={(val) => this.handleInputChange(val, input.type, input.name)}
                />
                {description}
              </div>
              {additionalInputs}
            </Card.Section>
          );
        }
      }
    }

    if (isMain && input.type !== "campaignSelect") {
      return (
        <Card.Section key={input.name}>
          {INPUT_TYPES[input.type].generate(input)}
        </Card.Section>
      );
    } else {
      return INPUT_TYPES[input.type].generate(input);
    }
  }

  generateModalInputs(input, value) {
    let inputs = [];
    let inputFormat = input.options.inputFormat;
    let values = null;
    if (value) {
      values = value.split(':').map((value) => value.trim());
    }
    let fullMatch = inputFormat.match(/{(\w+\??):(\w+):([\w\s'.(),]+):?([\w\s|,]+)?}/);
    let index = 0;
    while(fullMatch) {
      let optional = false;
      let [name, type, description, options] = [fullMatch[1], fullMatch[2], fullMatch[3], fullMatch[4]];
      if (options) {
        options = options.split(',').map((option) => {
          const [value, label] = option.split('|');
          return {
            value,
            label
          };
        });
        value = values ? values[index] : options[0].value;
      } else {
        value = values ? values[index] : "";
      }

      const questionIndex = name.indexOf('?');

      if (questionIndex > -1) {
        optional = true;
        name = name.substring(0, questionIndex);
      }

      const newInput = {
        name,
        optional,
        label: splitAndCapitalize('_', name),
        type,
        value,
        options,
        description
      };
      inputs.push(newInput);
      inputFormat = inputFormat.replace(fullMatch[0], '');
      fullMatch = inputFormat.match(/{(\w+\??):(\w+):([\w\s'.(),]+):?([\w\s|,]+)?}/);
      index++;
    }
    return inputs;
  }

  handleModalReturn(values, input, index) {
    if (!values) { return; }
    let currentValue = this.state.inputs[input.type][input.name];

    // Handle array and objects
    if (input.type === "array") {
      if (currentValue) {
        currentValue += `,${values.join('')}`;
      } else {
        currentValue = values.join('');
      }
    } else {
      // Build input value for text box
      let newValue = input.options.inputFormat;
      for (let index = 0; index < values.length; index++) {
        if (typeof values[index] === 'string') {
          // Replace any $ with $$ so we don't replace $<#> with matches in the regex
          values[index] = values[index].replace(/\$/g, '$$$');
        }
        newValue = newValue.replace(/{(\w+\??):(\w+):([\w\s'.(),]+):?([\w\s|,]+)?}/, values[index]);
      }

      // Add new content, or replace old content if editing
      if (index === undefined) {
        // Add value to text box with a new line if there is already content
        if (currentValue) {
          currentValue += `\n${newValue}`;
        } else {
          currentValue = newValue;
        }
      } else {
        currentValue = currentValue.split('\n');
        currentValue.splice(index, 1, newValue);
        currentValue = currentValue.join('\n');
      }
    }

    const newState = this.state;
    newState.inputs[input.type][input.name] = currentValue;
    this.setState(newState);
  }

  buildAndAddCampaign(evt) {
    evt.preventDefault();
    const newCampaign = {
      name: this.props.currentCampaign.value,
      active: this.state.isActive,
      label: this.state.inputs.campaignLabel,
      id: this.props.existingInfo ? this.props.existingInfo.id : null,
      dependants: this.props.currentCampaign.dependants,
      inputs: []
    }
    const campaignInputs = this.props.currentCampaign.inputs;

    this.inputMap[this.mainCampaignName].forEach((input) => {
        if (!isCampaignSelect(input)) {
          newCampaign.inputs.push(this.getInputValue(input, newCampaign.name, campaignInputs));
        } else {
          newCampaign.inputs.push(this.getInputsForCampaign(input, campaignInputs));
        }
    });
    this.props.addCampaign(newCampaign);
  }

  getInputsForCampaign(campaignSelect, campaignInputs) {
    const newInput = {
      name: this.getInputValue(campaignSelect)
    };
    if (Array.isArray(this.inputMap[campaignSelect])) {
      newInput.inputs = [];
      this.inputMap[campaignSelect].forEach((campaignInput) => {
        if (isCampaignSelect(campaignInput)) {
          newInput.inputs.push(this.getInputsForCampaign(campaignInput, campaignInputs))
        } else {
          newInput.inputs.push(this.getInputValue(campaignInput, newInput.name, campaignInputs));
        }
      });
    }

    return newInput;
  }

  getInputValue(inputName, campaignName, campaignInputs) {
    const type = getInputType(inputName);
    let value = this.state.inputs[type][inputName];
    // Can modify values here (like make csv's into an array)
    switch (type) {
      case 'array':
        if (!value) { return '[]'; }
        return `[${value.split(',').map((val) => `"${val.trim()}"`).join(', ')}]`;
      case 'text':
        return value ? `"${value}"` : '""';
      case 'select':
        return `:${value || this.defaults[inputName]}`;
      case 'boolean':
        return value ? true : false;
      case 'number':
        return parseFloat(value < 0 ? -value : value) || 0;
      case 'object':
        if (!value) { return "{}"; }
        try {
          const [inputFormat, outputFormat] = getObjectFormats(campaignName, campaignInputs);
          const output = formatObject('output', value, inputFormat, outputFormat);
          return `{${output}}`;
        } catch (error) {
          // Alert user if there was a parsing error (as best we can) and prevent going any further
          alert (`Error parsing object input for ${splitCamelCase(campaignName)}. Make sure your input matches the required format`);
          console.warn(error);
          throw Error(`Error parsing object input for ${splitCamelCase(campaignName)}. Make sure your input matches the required format`);
        }
      case 'objectArray':
        if (!value) { return "[]"; }
        try {
          const [inputFormat, outputFormat] = getObjectFormats(campaignName, campaignInputs);
          const output = formatObject('output', value, inputFormat, outputFormat);
          return `[${output}]`;
        } catch (error) {
          // Alert user if there was a parsing error (as best we can) and prevent going any further
          alert (`Error parsing object input for ${splitCamelCase(campaignName)}. Make sure your input matches the required format`);
          console.warn(error);
          throw Error(`Error parsing object input for ${splitCamelCase(campaignName)}. Make sure your input matches the required format`);
        }
      case 'campaignSelect':
        return value || 'none';
      default:
        return value;
    }
  }

  handleCampaignSelect(val) {
    if (this.props.currentCampaign !== null) {
      this.setState({inputs: JSON.parse(JSON.stringify(this.blankInputState))});
    }
    this.props.updateCurrentCampaign(val);
  }

  hideForm() {
    this.setState({inputs: JSON.parse(JSON.stringify(this.blankInputState))});
    this.props.updateCurrentCampaign(null);
    this.props.showForm(false);
  }

  renderForm() {
    return [
      <Card.Section key="campaign-desc" title="Campaign name (optional)">
        <TextField
          key="campaign-desc"
          name="campaign-desc"
          helpText="Not visible to customers"
          value={this.state.inputs.campaignLabel}
          onChange={(val) => this.handleInputChange(val)}
        />
      </Card.Section>,
      <form key="campaign-form" onSubmit={this.buildAndAddCampaign}>
        {this.generateInputsForCampaign(this.props.currentCampaign, this.mainCampaignName)}
      </form>
    ];
  }

  render() {
    const {isActive} = this.state;

    // Reset input map and defaults for selects
    this.inputMap = {};
    this.defaults = {};

    const campaignSelector = (
      <Select
        name={this.mainCampaignName}
        options={this.props.availableCampaigns}
        value={this.props.currentCampaign && this.props.currentCampaign.value}
        placeholder="Select campaign"
        onChange={(val) => this.handleCampaignSelect(val)}
      />
    );

    const footerActions = {
      secondary: {
        content: "Save",
        primary: true,
        disabled: !this.props.currentCampaign,
        onAction: this.buildAndAddCampaign
      },
      primary: {
        content: "Cancel",
        destructive: true,
        onAction: this.hideForm
      }
    };

    const action = {content: isActive ? 'Deactivate' : 'Activate', onAction: this.toggleActive};

    return (
      <Card
        title="Campaign details"
        primaryFooterAction={footerActions.primary}
        secondaryFooterAction={footerActions.secondary}
        actions={[action]}
      >
        {this.state.modalOpen && <Modal />}
        <Card.Section title="Select a campaign">
          <div className="select-wrapper">
            {campaignSelector}
            {this.props.currentCampaign && <TextStyle variation="subdued"><strong>What it does: </strong>{this.props.currentCampaign.description}</TextStyle>}
          </div>
        </Card.Section>
        {this.props.currentCampaign && this.renderForm()}
      </Card>
    )
  }
}
