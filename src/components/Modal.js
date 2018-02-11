import React, { Component, Fragment } from 'react';
import { 
  Stack,
  Heading,
  Button,
  Card,
  TextField,
  FormLayout
} from '@shopify/polaris';

import styles from './Modal.css';

export default class Modal extends Component {
  constructor(props) {
    super(props)

    this.handleSubmit = this.handleSubmit.bind(this);

    this.state = {
      values: [],
      errors: []
    };

    this.isEditing = false;
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
      if (newState.values[0] !== "") {
        this.isEditing = true;
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
      if (this.state.values[index].trim() === "") {
        // Set to an error message instead to make this more flexible?
        newState.errors[index] = "Must enter a value";
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
    if (value.trim() === "") {
      newState.errors[index] = "Must enter a value";
    } else {
      newState.errors[index] = false;
    }
    newState.values[index] = value;
    this.setState(newState);
  }

  render() {
    const hasInputs = this.props.inputs && this.props.inputs.length > 0;
    const hasActions = this.props.actions && this.props.actions.length > 0;

    const title = hasInputs 
      ? (this.isEditing ? 'Edit' : 'Add') + this.props.title.toLowerCase()
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
            <form ref={(form) => this.form = form} onSubmit={this.handleSubmit}>
              <Card.Section>
                <div className="Modal__Content">
                  {this.props.content}
                  {hasInputs &&
                    <FormLayout>
                      {this.props.inputs.map((input, index) => {
                        return (
                          <TextField
                            label={input.label}
                            key={input.name}
                            type={input.type}
                            min={input.type === "number" ? 0 : undefined}
                            step={input.type === "number" ? 0.01 : undefined}
                            name={input.name}
                            autoFocus={index === 0}
                            helpText={input.description}
                            error={this.state.errors[index]}
                            value={this.state.values[index]}
                            onChange={(val) => this.handleInputChange(val, index)}
                          />
                        );
                      })}
                    </FormLayout>
                  }
                </div>
              </Card.Section>
              {hasActions &&
                <Card.Section>
                  <Stack
                    distribution="trailing"
                  >
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