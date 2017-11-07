import React, { Component } from 'react';
import { Layout, Card, TextField } from '@shopify/polaris';
import styles from './ScriptOutput.css';

export default class ScriptOutput extends Component {
  render() {
    return (
      <Card title="Script code" sectioned>
        <TextField
          id="ScriptOutput"
          multiline={10}
          readOnly
          value={this.props.output}
          helpText="Copy the code here and paste into a new script in the Script Editor App. Be sure to create the proper script based on the type that you selected."
        />
      </Card>
    )
  }
}