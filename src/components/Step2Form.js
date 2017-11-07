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
import { capitalize, splitAndCapitalize } from '../helpers';

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
      inputs: JSON.parse(JSON.stringify(this.blankInputState)),
      editId: null
    }

    this.inputMap = {};
    this.totalCampaigns = 0;

    this.handleInputChange = this.handleInputChange.bind(this);
    this.resetInputs = this.resetInputs.bind(this);
    this.buildAndAddCampaign = this.buildAndAddCampaign.bind(this);
    this.getInputValue = this.getInputValue.bind(this);
    this.populateBasedOnExistingInfo = this.populateBasedOnExistingInfo.bind(this);
  }

  componentDidMount() {
    if (this.props.existingInfo) {
      this.populateBasedOnExistingInfo(this.props.existingInfo);
    }
  }

  componentWillReceiveProps(newProps) {
    if (this.props.existingInfo && this.props.existingInfo.id !== newProps.existingInfo.id) {
      this.populateBasedOnExistingInfo(newProps.existingInfo);
    }
  }

  componentDidUpdate() {
    if (this.state.editId !== null) {
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
    const initalUpdate = this.state.editId !== existingInfo.id;
    const inputs = existingInfo.inputs;
    const inputMap = this.inputMap;
    if (initalUpdate) {
      newState.inputs = JSON.parse(JSON.stringify(this.blankInputState));
      newState.editId = existingInfo.id;
    } else {
      newState.editId = null;
    }
    setValuesForInputs(inputs);
    this.setState(newState);

    function setValuesForInputs(inputs) {
      inputs.forEach((input, index) => {
        if (initalUpdate) {
          newState.inputs.campaignSelect[`campaignSelect_${index}`] = input.name;
        } else {
          const key = `campaignSelect_${index}`;
          if (Array.isArray(inputMap[key])) {
            inputMap[key].forEach((inputName, index) => {
              const type = inputName.split('-')[1].split('_')[0];
              newState.inputs[type][inputName] = convertInput(input.inputs[index], type);
            });
          }
        }
      });

      function convertInput(value, type) {
        switch (type) {
          case 'array':
            // Remove %w( and ). Then split on space and join with a comma and space to seperate
            return value.substring(value.length -1, 0).substring(3).split(' ').join(', ');
          case 'text':
            // Remove quotes
            return value.substring(value.length -1, 0).substring(1);
          case 'select':
            // Remove :
            return value.substring(1);
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
      )
    } else {
      return (
        <Card sectioned>
          <FormLayout>
            <Subheading>Conditions</Subheading>
            {this.generateInputsForCampaign(campaign, mapTo)}
          </FormLayout>
        </Card>
      )
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
      console.log(inputName);
      inputs.push(this.inputGenerator(newInput));
      if (mapTo) {
        if (!this.inputMap[mapTo]) {
          this.inputMap[mapTo] = [inputName];
        } else {
          this.inputMap[mapTo].push(inputName);
        }
      }
      console.log(this.inputMap);
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
          )
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
          )
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
          )
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
          )
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
          )
        }
      },
      campaignSelect: {
        generate: (input) => {
          const value = this.state.inputs[input.type][input.name];
          this.totalCampaigns++;
          let descText = null;
          if (value === 'none') {
            descText = input.options.filter((option) => option.value === value)[0].description;
            this.inputMap[input.name] = 'none';
          }
          let description = value === 'none' ? <TextStyle key={`${input.name}-text`} variation="subdued"><strong>Details: </strong>{descText}</TextStyle> : null;
          let additionalInputs = null;
          if (value && value !== 'none') {
            const campaign = input.options.filter((option) => option.value === value)[0];
            description = <TextStyle key={`${input.name}-text`} variation="subdued"><strong>Details: </strong>{campaign.description}</TextStyle>;
            additionalInputs = this.generateAdditionalInputs(campaign, input.name);
          }
          return [
            <Select
              label={<strong>{input.label}</strong>}
              options={input.options}
              placeholder="Pick one"
              key={input.name}
              name={input.name}
              value={value}
              onChange={(val) => this.handleInputChange(val, input.type, input.name)}
            />,
            description,
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
    console.log(newCampaign);
    Object.keys(this.inputMap).forEach((key) => {
      console.log(key);
      const newInput = {
        name: this.getInputValue(key)
      }
      if (newInput.className !== 'none') {
        newInput.inputs = [];
        if (this.inputMap[key] === 'none') {
          newInput.inputs.push('none');
        } else {
          this.inputMap[key].forEach((input) => {
            newInput.inputs.push(this.getInputValue(input));
          });
        }
      }

      newCampaign.inputs.push(newInput);
    });

    // TODO: Find out why this has an id
    console.log(newCampaign);

    this.props.addCampaign(newCampaign);
  }

  getInputValue(inputName) {
    const type = inputName.indexOf('-') > -1 ? inputName.split('-')[1].split('_')[0] : 'campaignSelect';
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

  resetInputs() {
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
        onAction: this.resetInputs
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
          {campaignSelector}
          {description}
          {this.props.currentCampaign && this.generateInputsForCampaign(this.props.currentCampaign)}
        </FormLayout>
      </Card>
    )
  }
}