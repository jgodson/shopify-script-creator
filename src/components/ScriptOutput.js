import React, { Component } from 'react';
import { Layout, Card, TextField } from '@shopify/polaris';
import styles from './ScriptOutput.css';

export default class ScriptOutput extends Component {
  constructor(props) {
    super(props);
    this.copyOutputCode = this.copyOutputCode.bind(this);
  }

  copyOutputCode() {
    // Google Analytics
    gtag('event', 'copyButtonClick', {'value': this.props.output.length});
    this.textField.input.select();
    document.execCommand('selectAll');
    document.execCommand('copy');
  }

  render() {
    const copy = {
      content: "Copy",
      icon: "duplicate",
      onAction: this.copyOutputCode
    };

    return (
      <Card title="Script code" sectioned actions={[copy]}>
        <TextField
          id="ScriptOutput"
          multiline={10}
          readOnly
          value={this.props.output}
          ref={(input) => this.textField = input}
          helpText="Copy the code here and paste into a new script in the Script Editor App. Be sure to create the proper script based on the type that you selected."
        />
      </Card>
    )
  }
}