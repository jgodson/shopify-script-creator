import React, { Component } from 'react';
import { Layout, Card, TextField } from '@shopify/polaris';
import styles from './ScriptOutput.css';

export default class ScriptOutput extends Component {
  constructor(props) {
    super(props);

    this.textfieldId = 'ScriptOutput';

    this.copyOutputCode = this.copyOutputCode.bind(this);
  }

  copyOutputCode() {
    document.querySelector(`#${this.textfieldId}`).select();
    document.execCommand('selectAll');
    document.execCommand('copy');
  }

  render() {
    const copy = {
      content: "Copy",
      onAction: this.copyOutputCode
    };

    return (
      <Card title="Script code" sectioned actions={[copy]}>
        <TextField
          id={this.textfieldId}
          multiline={10}
          readOnly
          value={this.props.output}
          helpText="Copy the code here and paste into a new script in the Script Editor App. Be sure to create the proper script based on the type that you selected."
        />
      </Card>
    )
  }
}