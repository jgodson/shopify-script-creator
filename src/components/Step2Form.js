import React, {Component} from 'react';
import {
  Layout,
  Card,
  FormLayout,
  TextField,
  Checkbox,
  TextStyle,
  Select,
  Subheading,
  Button,
  ButtonGroup
} from '@shopify/polaris';
import styles from './Step2Form.css';
import { capitalize, splitAndCapitalize, isNestedCampaignSelect } from '../helpers';

export default class Step2Form extends Component {
  constructor(props) {
    super(props);

    this.blankInputState = {
      campaignSelect: {},
      select: {},
      text: {},
      number: {},
      array: {},
      boolean: {},
    }

    this.state = {
      inputs: JSON.parse(JSON.stringify(this.blankInputState))
    }

    this.inputMap = {};
    this.totalCampaigns = 0;
    this.updateCount = 0;

    this.handleInputChange = this.handleInputChange.bind(this);
    this.hideForm = this.hideForm.bind(this);
    this.buildAndAddCampaign = this.buildAndAddCampaign.bind(this);
    this.getInputValue = this.getInputValue.bind(this);
    this.populateBasedOnExistingInfo = this.populateBasedOnExistingInfo.bind(this);
    this.getInputsForCampaign = this.getInputsForCampaign.bind(this);
  }

  componentDidMount() {
    if (this.props.existingInfo) {
      this.populateBasedOnExistingInfo(this.props.existingInfo);
    }
  }

  componentWillReceiveProps(newProps) {
    if (this.props.existingInfo && this.props.existingInfo.id !== newProps.existingInfo.id) {
      // Reset update count so we can populate the new information
      this.updateCount = 0;
      this.populateBasedOnExistingInfo(newProps.existingInfo);
    }
  }

  componentDidUpdate() {
    if (this.props.existingInfo && this.updateCount < 3) {
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
    newState.inputs[type][name] = newVal;
    this.setState(newState);
  }

  populateBasedOnExistingInfo(existingInfo) {
    const newState = this.state;
    const inputs = existingInfo.inputs;
    const updateCount = this.updateCount;
    const inputMap = this.inputMap;
    if (updateCount === 0) {
      newState.inputs = JSON.parse(JSON.stringify(this.blankInputState));
    }
    setValuesForInputs(inputs);
    this.updateCount++;
    this.setState(newState);

    function setValuesForInputs(inputs, doNested) {
      if (updateCount === 3) { return; }
      inputs.forEach((input, inputIndex) => {
        switch (updateCount) {
          case 0:
            // Pick the first set of campaigns
            newState.inputs.campaignSelect[`campaignSelect_${inputIndex}`] = input.name;
            break;
          case 1:
            // Pick the second set of campaigns (if there is any)
            if (Array.isArray(input.inputs) && typeof input.inputs[0] === 'object') {
              input.inputs.forEach((secondInput, secondIndex) => {
                newState.inputs.campaignSelect[`campaignSelect_${inputIndex}-campaignSelect_${secondIndex}`] = secondInput.name;
              });
            }
            break;
          default:
            // Set the values
            if (input.inputs !== undefined && typeof input.inputs[0] !== "object") {
              const inputsToDo = Object.keys(inputMap).filter((key) => {
                if (doNested) {
                  return isNestedCampaignSelect(key);
                } else {
                  return !isNestedCampaignSelect(key);
                }
              });
              inputsToDo.forEach((key, campaignIndex) => {
                if (inputIndex === campaignIndex) {
                  inputMap[key].forEach((inputName, index) => {
                    if (!isNestedCampaignSelect(inputName)) {
                      let type = inputName.split('-');
                      type = type[type.length - 1].split('_')[0];
                      newState.inputs[type][inputName] = convertInput(input.inputs[index], type);
                    }
                  });
                }
              });
            } else if (input.name !== 'none') {
              setValuesForInputs(input.inputs, true);
            }
            break;
        }
      });

      function convertInput(value, type) {
        switch (type) {
          case 'array':
            // Remove %w( and ). Then split on space and join with a comma and space to seperate
            return typeof value === "string" && value.substring(value.length -1, 0).substring(3).split(' ').join(', ');
          case 'text':
            // Remove quotes
            return typeof value === "string" && value.substring(value.length -1, 0).substring(1);
          case 'select':
            // Remove :
            return typeof value === "string" && value.substring(1);
          default:
            return value;
        }
      }
    }
  }

  generateAdditionalInputs(campaign, mapTo) {
    if (campaign.inputs[Object.keys(campaign.inputs)[0]].type) {
      return (
        <FormLayout.Group>
          {this.generateInputsForCampaign(campaign, mapTo)}
        </FormLayout.Group>
      );
    } else {
      return (
        <Card sectioned>
          <FormLayout>
            <Subheading>Conditions</Subheading>
            {this.generateInputsForCampaign(campaign, mapTo)}
          </FormLayout>
        </Card>
      );
    }
  }

  generateInputsForCampaign(campaign, mapTo) {
    const inputs = [];
    const fields = campaign.inputs;
    Object.keys(fields).forEach((key) => {
      const inputType = fields[key].type || 'campaignSelect';
      const inputId = inputs.length;
      const inputName = mapTo ? `${mapTo}-${inputType}_${inputId}` : `${inputType}_${inputId}`;
      const newInput = {
        type: inputType,
        label: key.indexOf('_') > -1 ? splitAndCapitalize('_', key) : capitalize(key),
        options: fields[key].options || fields[key],
        description: fields[key].description,
        name: inputName,
      };
      inputs.push(this.inputGenerator(newInput));
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

  inputGenerator(input) {
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
              type="number"
              helpText={input.description}
              value={this.state.inputs[input.type][input.name]}
              onChange={(val) => this.handleInputChange(val, input.type, input.name)}
            />
          );
        }
      },
      select: {
        generate: (input) => {
          const helpText = <TextStyle variation="subdued">{input.description}</TextStyle>;
          return (
            <div key={input.name} className="select-wrapper">
              <Select
                label={input.label}
                options={input.options}
                placeholder="Pick one"
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
          return (
            <TextField
              label={input.label}
              placeholder={`Enter some ${input.label}...`}
              key={input.name}
              name={input.name}
              multiline={3}
              helpText={input.description}
              value={this.state.inputs[input.type][input.name] || input.value}
              onChange={(val) => this.handleInputChange(val, input.type, input.name)}
            />
          );
        }
      },
      campaignSelect: {
        generate: (input) => {
          let value = this.state.inputs[input.type][input.name];
          if (value && typeof value !== 'string') {
            value = value.name;
          }

          this.totalCampaigns++;
          let descText = null;
          if (value === 'none') {
            descText = input.options.filter((option) => option.value === value)[0].description;
            this.inputMap[input.name] = 'none';
          }
          let description = value === 'none' ? <TextStyle variation="subdued"><strong>Details: </strong>{descText}</TextStyle> : null;
          let additionalInputs = null;
          if (value && value !== 'none') {
            const campaign = input.options.filter((option) => option.value === value)[0];
            description = <TextStyle variation="subdued"><strong>Details: </strong>{campaign.description}</TextStyle>;
            additionalInputs = this.generateAdditionalInputs(campaign, input.name);
          }
          return [
            <div key={input.name} className="select-wrapper">
              <Select
                label={<strong>{input.label}</strong>}
                options={input.options}
                placeholder="Pick one"
                name={input.name}
                value={value}
                onChange={(val) => this.handleInputChange(val, input.type, input.name)}
              />
              {description}
            </div>,
            additionalInputs
          ]
        }
      }
    }

    return INPUT_TYPES[input.type].generate(input);
  }

  buildAndAddCampaign() {
    const newCampaign = {
      name: this.props.currentCampaign.value,
      id: this.props.existingInfo ? this.props.existingInfo.id : null,
      inputs: []
    }
    Object.keys(this.inputMap).forEach((campaignSelect) => {
      if (campaignSelect.split('-').length === 1) {
        newCampaign.inputs.push(this.getInputsForCampaign(campaignSelect));
      }
    });

    this.props.addCampaign(newCampaign);
  }

  getInputsForCampaign(campaignSelect) {
    const newInput = {
      name: this.getInputValue(campaignSelect)
    }

    if (newInput.name !== 'none') {
      newInput.inputs = [];
      this.inputMap[campaignSelect].forEach((campaignInput) => {
        if (isCampaign(campaignInput)) {
          newInput.inputs.push(this.getInputsForCampaign(campaignInput))
        } else {
          newInput.inputs.push(this.getInputValue(campaignInput));
        }
      });
    }

    return newInput;

    function isCampaign(inputName) {
      const split = inputName.split('-');
      const compareTo = split[0].split('_')[0];
      return split[split.length - 1].split('_')[0] === compareTo;
    }
  }

  getInputValue(inputName) {
    let type = inputName.split('-');
    type = type[type.length - 1].split('_')[0];
    let value = this.state.inputs[type][inputName];
    // Can modify values here (like make an array into an array)
    switch (type) {
      case 'array':
        if (!value) { return ""; }
        return `%w(${value.split(',').map((val) => val.trim()).join(' ')})`;
      case 'text':
        return value ? `"${value}"` : "";
      case 'select':
        return `:${value}`;
      case 'boolean':
        return value ? true : false;
      case 'number':
        return value || 0;
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

  render() {
    this.inputMap = {};
    const campaignSelector = (
      <Select
        label={<strong>Select a campaign</strong>}
        options={this.props.availableCampaigns}
        value={this.props.currentCampaign && this.props.currentCampaign.value}
        placeholder="Select campaign"
        onChange={(val) => this.handleCampaignSelect(val)}
      />
    );
    const description = this.props.currentCampaign && (
      <TextStyle variation="subdued"><strong>Details: </strong>{this.props.currentCampaign.description}</TextStyle>
    );
    const inputCount = this.props.currentCampaign ? Math.max(this.totalCampaigns, this.props.availableCampaigns.length) : this.totalCampaigns + 1;
    const fieldsFilled = Object.keys(this.state.inputs.campaignSelect).length;
    const footerActions = {
      secondary: {
        content: "Save",
        primary: true,
        disabled: inputCount !== fieldsFilled,
        onAction: this.buildAndAddCampaign
      },
      primary: {
        content: "Cancel",
        destructive: true,
        onAction: this.hideForm
      }
    };
    this.totalCampaigns = 0;

    return (
      <Card
        title="Campaign details"
        sectioned
        primaryFooterAction={footerActions.primary}
        secondaryFooterAction={footerActions.secondary}
      >
        <FormLayout>
          <div className="select-wrapper">
            {campaignSelector}
            {description}
          </div>
          {this.props.currentCampaign && this.generateInputsForCampaign(this.props.currentCampaign)}
        </FormLayout>
      </Card>
    )
  }
}