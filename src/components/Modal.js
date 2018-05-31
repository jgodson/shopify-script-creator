import React, { Component, Fragment } from 'react';
import { 
  Stack,
  Heading,
  Button,
  Card,
  TextField,
  Select,
  FormLayout
} from '@shopify/polaris';

import styles from './Modal.css';

export default class Modal extends Component {
  constructor(props) {
    super(props)

    this.handleSubmit = this.handleSubmit.bind(this);
    this.generateInput = this.generateInput.bind(this);

    this.state = {
      values: [],
      errors: [],
      isEditing: false,
    };
  }

  componentDidMount() {
    // When first opened, focus on the close button if there are no inputs
    const numInputs = this.props.inputs && this.props.inputs.length;
    if (numInputs && numInputs > 0) {
      // Initialize the values. We need the exact order when returning
      const newState = this.state;
      const iterations = numInputs;
      for (let index = 0; index < iterations; index++) {
        newState.values[index] = this.props.inputs[index].value;
      }

      // Set the editing state if every input value isn't blank
      if (newState.values.every((val) => val !== '')) {
        newState.isEditing = true;
      }

      // Focus the select if it's the first input (nothing on the compnent to autofocus)
      if (this.props.inputs[0].type === 'select') {
        document.querySelector('.Modal').querySelector('select').focus();
      }
      
      this.setState(newState);
    } else {
      document.querySelector('.Modal').querySelector('button').focus();
    }
  }

  handleSubmit(evt) {
    evt.preventDefault();
    const hasInputs = !!this.state.values.length;
    if (!hasInputs) { return this.props.onClose(true); }
    
    // Validate that nothing is blank
    const newState = this.state;
    let preventSubmission = false;
    for (let index = 0; index < this.state.values.length; index++) {
      const value = this.state.values[index];
      if (typeof value !== 'number' && value.trim() === "") {
        newState.errors[index] = 'Must enter a value';
        preventSubmission = true;
      }
    }

    if (preventSubmission) { 
      this.setState(newState);
      return;
    }
    this.props.onClose(this.state.values);
  }

  handleInputChange(value, index) {
    let newState = this.state;
    if (typeof(value) !== 'number' && value.trim() === '') {
      newState.errors[index] = 'Must enter a value';
    } else {
      newState.errors[index] = false;
    }
    newState.values[index] = value;
    this.setState(newState);
  }

  generateInput(input, index) {
    const { type, label, options, name, description } = input;

    switch(type) {
      case 'select':
        return (
          <Select
            label={label}
            key={name}
            options={options}
            name={name}
            helpText={description}
            value={this.state.values[index]}
            onChange={(val) => this.handleInputChange(val, index)}
          />
        );
      default:
        return (
          <TextField
            label={label}
            key={name}
            type={type}
            min={type === 'number' ? 0 : undefined}
            step={type === 'number' ? 0.01 : undefined}
            name={name}
            autoFocus={index === 0}
            helpText={description}
            error={this.state.errors[index]}
            value={this.state.values[index]}
            onChange={(val) => this.handleInputChange(type === 'number' ? Math.abs(val) : val, index)}
          />
        );
    }
  }

  render() {
    const hasInputs = this.props.inputs && this.props.inputs.length > 0;
    const hasActions = this.props.actions && this.props.actions.length > 0;
    const { isEditing } = this.state;

    const title = hasInputs 
      ? `${(isEditing ? 'Edit' : 'Add')} ${this.props.title.toLowerCase()}`
      : this.props.title;

    return (
      <Fragment>
        <div className="Modal__Backdrop" onClick={() => this.props.onClose(false)}></div>
        <div className="Modal">
          <Card>
            <Card.Section>
              <Stack alignment="trailing" distribution="equalSpacing">
                <Heading>{title}</Heading>
                <Button
                  plain
                  icon="cancel"
                  onClick={() => this.props.onClose(false)}
                />
              </Stack>
            </Card.Section>
            <form onSubmit={this.handleSubmit}>
              <Card.Section>
                <div className="Modal__Content">
                  {this.props.content}
                  {hasInputs &&
                    <FormLayout>
                      {this.props.inputs.map(this.generateInput)}
                    </FormLayout>
                  }
                </div>
              </Card.Section>
              {hasActions &&
                <Card.Section>
                  <Stack distribution="trailing">
                    {this.props.actions.map((action, index) => {
                      return (
                        <Button
                          key={`modalActions-${index}`}
                          primary={action.primary}
                          destructive={action.destructive}
                          submit={action.submit}
                          onClick={action.onClick === 'close' ? () => this.props.onClose(false) : action.onClick}
                        >
                          {action.content}
                        </Button>
                      );
                    })}
                  </Stack>
                </Card.Section>
              }
            </form>
          </Card>
        </div>
      </Fragment>
    )
  }
}