import React, {Component} from 'react';
import { Layout, Page, PageActions, EmptyState } from '@shopify/polaris';
import Step1Buttons from './components/Step1Buttons';
import Step2Form from './components/Step2Form';
import Campaigns from './components/Campaigns';
import ScriptOutput from './components/ScriptOutput';
import Footer from './components/Footer';

import LineItemCampaign from './scripts/lineItem';

class App extends Component {
  constructor(props) {
    super(props);

    this.defaultState = {
      scriptType: 'line_item',
      step2: {
        shown: false,
      },
      currentCampaign: null,
      availableCampaigns: this.getCampagins('line_item'),
      campaigns: [{name: "Add new campaign", skip: true}],
      currentId: 0,
      output: '',
      editCampaignInfo: null
    };

    this.state = JSON.parse(JSON.stringify(this.defaultState));

    this.typeChange = this.typeChange.bind(this);
    this.reset = this.reset.bind(this);
    this.generateScript = this.generateScript.bind(this);
    this.addCampaign = this.addCampaign.bind(this);
    this.editCampaign = this.editCampaign.bind(this);
    this.removeCampaign = this.removeCampaign.bind(this);
    this.updateCurrentCampaign = this.updateCurrentCampaign.bind(this);
    this.getCampagins = this.getCampagins.bind(this);
    this.getCampaignInfo = this.getCampaignInfo.bind(this);
    this.getCampaignById = this.getCampaignById.bind(this);
    this.showForm = this.showForm.bind(this);
    this.download = this.download.bind(this);
    this.downloadCampaigns = this.downloadCampaigns.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  }

  typeChange(newType) {
    if (this.state.campaigns.length > 1 || this.state.step2.shown) {
      const response = confirm("Changing the script type will clear your current campaigns. Are you sure?");
      
      if (!response) { return; };
    }

    const newState = JSON.parse(JSON.stringify(this.defaultState));
    newState.scriptType = newType;
    newState.availableCampaigns = this.getCampagins(newType);
    this.setState(newState);
  }

  reset() {
    const response = confirm("Are you sure you want to clear your work and start over?");
    
    if (response) {
      this.setState(JSON.parse(JSON.stringify(this.defaultState)));
    }
  }

  getCampagins(type) {
    switch(type) {
      case 'line_item':
        return LineItemCampaign.campaigns;
        break;
      case 'shipping':
        break;
      case 'payment':
        break;
      default:
      console.warn("Invalid type");
    }
  }

  updateCurrentCampaign(campaignName) {
    const newState = this.state;
    newState.currentCampaign = this.getCampaignInfo(campaignName);
    this.setState(newState);
  }

  getCampaignInfo(name) {
    return this.state.availableCampaigns.filter((campaign) => campaign.value === name)[0];
  }

  getCampaignById(id) {
    return this.state.campaigns.find((campaign) => campaign.id === id);
  }

  editCampaign(campaignId) {
    const newState = this.state;
    newState.step2.shown = true;
    const campaign = this.getCampaignById(campaignId);
    newState.currentCampaign = this.getCampaignInfo(campaign.name);
    newState.editCampaignInfo = campaign;
    newState.output = '';
    this.setState(newState);
  }

  removeCampaign(campaignId) {
    const response = confirm("Are you sure you want to remove this campaign?");
    if (!response) { return; }

    const newState = this.state;
    const index = this.state.campaigns.findIndex((campaign) => campaign.id === campaignId);
    newState.campaigns.splice(index, 1);
    this.setState(newState);
  }

  showForm(boolean) {
    const newState = this.state;
    if (!boolean) {
      newState.editCampaignInfo = null;
    }
    newState.step2.shown = boolean;
    newState.output = '';
    this.setState(newState);
  }

  addCampaign(campaign) {
    const newState = this.state;
    if (campaign.id === null) {
      campaign.id = this.state.currentId;
      newState.currentId = ++campaign.id;
      newState.campaigns.unshift(campaign);
    } else {
      const existingId = campaign.id
      const index = this.state.campaigns.findIndex((campaign) => campaign.id === existingId);
      newState.campaigns.splice(index, 1, campaign);
    }
    newState.currentCampaign = null;
    newState.editCampaignInfo = null;
    newState.step2.shown = false;
    this.setState(newState);
  }

  generateScript() {
    if (this.state.step2.shown) {
      alert("Save or discard changes to the current campaign first.");
      return;
    }
    const newState = this.state;
    newState.step2.shown = false;
    let output = "";
    switch(this.state.scriptType) {
      case 'line_item':
        output += LineItemCampaign.classes;
        output += this.generateCampaignsOutput();
        break;
      case 'shipping':
        break;
      case 'payment':
        break;
      default:
      console.warn("Invalid type");
    }
    // Trim space from lines
    //output = output.split('\n').filter((line) => line.trim() !== '').map((line) => line.trim()).join('\n');
    newState.output = output;
    this.setState(newState);
  }

  generateCampaignsOutput() {
    let output;
    switch(this.state.scriptType) {
      case 'line_item':
        let campaigns = this.state.campaigns.map((campaign) => this.generateCampaignCode(campaign)).join();
        // remove the last `,` from the string (raises syntac)
        campaigns = campaigns.substring(campaigns.length -1, 0);
        output = LineItemCampaign.defaultCode.replace('|', campaigns);
        break;
      case 'shipping':
        break;
      case 'payment':
        break;
      default:
      console.warn("Invalid type");
    }
    return output;
  }

  generateCampaignCode(campaign) {
    if (campaign.skip) { return; }
    if (campaign.inputs) {
      const inputsCode = campaign.inputs.map((input) => this.generateCampaignInputCode(input)).join();
      return `
  ${campaign.name}.new(
    ${inputsCode}
  )`;
    } else {
      return `  ${campaign.name}.new()\n`;
    }
  }

  generateCampaignInputCode(input) {
    if (input.name === 'none') { return '\n      nil'; };
    console.log(input);
    return `
    ${input.name}.new(
      ${input.inputs.map((value) => value).join()}
    )`;
  }

  download(data, filename, type) {
    const file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob)
      // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    else {
      const link = document.createElement("a");
      const url = URL.createObjectURL(file);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(function() {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);  
      }, 0); 
    }
  }

  uploadFile() {
    if (!window.FileReader) {
      alert('Sorry, your browser does not support importing files.');
      return false;
    }
    let fileInput = document.querySelector('#FileImport');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'FileImport';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
      fileInput.addEventListener('change', (evt) => {
        readFile(evt.target, (loadedCampaigns) => {
          if (loadedCampaigns && loadedCampaigns.length > 0) {
            const newState = JSON.parse(JSON.stringify(this.defaultState));
            loadedCampaigns.reverse().forEach((campaign) => {
              newState.campaigns.unshift(campaign);
            });
            const newId = loadedCampaigns.sort((a, b) => a.id - b.id)[0].id + 1;
            newState.currentId = newId;
            this.setState(newState);
          }
          document.body.removeChild(evt.target);
        });
      });
    }
    fileInput.click();

    function readFile(fileInput, callback) {
      // Create a reader object
      const reader = new FileReader();
      if (fileInput.files.length) {
        const textFile = fileInput.files[0];
        // Read the file
        reader.readAsText(textFile);
        // When it's loaded, process it
        reader.addEventListener('load', (evt) => {
          const result = processFile(evt);
          callback(result);
        });
      }
      
      function processFile(evt) {
        const file = evt.target.result;
        const validFileSignature = 'ShopifyScriptCreatorFile';
        let results = null;
        if (file && file.length) {
          results = file;
          if (results.indexOf(validFileSignature) > -1) {
            return JSON.parse(results.split(validFileSignature)[1]);
          } else {
            alert('File does not appear to be a valid script creator file');
          }
        } else {
          alert('File does not appear to be a valid script creator file');
          return null;
        }
      }
    }
  }

  downloadCampaigns() {
    const filename = `SSC-script-${parseInt(Math.random() * 100000000)}.txt`;
    const campaigns = this.state.campaigns.filter((campaign) => !campaign.skip);
    const data = `ShopifyScriptCreatorFile${JSON.stringify(campaigns)}`;
    this.download(data, filename, 'text/plain');
  }

  render() {
    const generate = {
      content: 'Generate script',
      onAction: this.generateScript
    };

    const clear = {
      content: 'Reset',
      destructive: true,
      onAction: this.reset
    };

    const secondaryActions = [
      {
        content: 'Download campaigns',
        onAction: this.downloadCampaigns,
        icon: 'save'
      },
      {
        content: 'Import campaigns',
        onAction: this.uploadFile,
        icon: 'notes'
      }
    ];

    const instructions = () => {
      if (this.state.campaigns.length === 1) {
        return (
          <EmptyState
            heading="Add your campaigns to generate a script"
            action={{content: 'Add campaign', onAction: () => this.showForm(true)}}
          >
            <p>Select a script type, add some campaigns and then click <strong>Generate script</strong> to generate script code to paste into your code editor. Try adding a campaign first.</p>
          </EmptyState>
        )
      } else {
        return (
          <EmptyState
            heading="Add more campaigns or generate script"
            action={{content: 'Generate script', onAction: this.generateScript}}
            secondaryAction={{content: 'Add another campaign', onAction: () => this.showForm(true)}}
          >
            <p>Add more campaigns to your script, or generate your script code now.</p>
          </EmptyState>
        )
      }
    };
    
    return (
      <Page title="Shopify Script Creator" secondaryActions={secondaryActions}>
        <Layout>
          <Layout.Section>
          <Step1Buttons changeType={this.typeChange} currentType={this.state.scriptType} />
          {this.state.step2.shown && 
            <Step2Form
              currentCampaign={this.state.currentCampaign}
              availableCampaigns={this.state.availableCampaigns}
              updateCurrentCampaign={this.updateCurrentCampaign}
              addCampaign={this.addCampaign}
              showForm={this.showForm}
              existingInfo={this.state.editCampaignInfo}
            />
          }
          {this.state.output && <ScriptOutput output={this.state.output} />}
          {(!this.state.step2.shown && !this.state.output) && instructions()}
          </Layout.Section>
          <Layout.Section secondary>
          <Campaigns 
            campaigns={this.state.campaigns}
            editCampaign={this.editCampaign}
            removeCampaign={this.removeCampaign}
            showForm={this.showForm}
            isEditing={!!this.state.editCampaignInfo}
          />
          </Layout.Section>
        </Layout>
        <PageActions
          primaryAction={generate}
          secondaryActions={[clear]}
        />
        <Footer />
      </Page>
    );
  }
}

export default App;
