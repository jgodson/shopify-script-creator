import React, {Component} from 'react';
import { Layout, Page, PageActions, EmptyState } from '@shopify/polaris';
import ScriptSelector from './components/ScriptSelector';
import CampaignForm from './components/CampaignForm';
import Campaigns from './components/Campaigns';
import ScriptOutput from './components/ScriptOutput';
import Footer from './components/Footer';

import LineItemScript from './scripts/lineItem';
import ShippingScript from './scripts/shipping';
import PaymentScript from './scripts/payment';
import Common from './scripts/common';

import Versions from './versions';

class App extends Component {
  constructor(props) {
    super(props);

    this.defaultState = {
      scriptType: 'line_item',
      showForm: false,
      currentCampaign: null,
      availableCampaigns: this.getCampagins('line_item'),
      campaigns: [{name: "Create new campaign", skip: true}],
      currentId: 0,
      output: '',
      editCampaignInfo: null
    };

    // Versions used for saving script files to detect imcompatabilities
    this.version = Versions.currentVersion;
    this.incompatibleVersions = Versions.incompatibleVersions;

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
    this.readFile = this.readFile.bind(this);
    this.processFile = this.processFile.bind(this);
    this.showForm = this.showForm.bind(this);
    this.download = this.download.bind(this);
    this.downloadCampaigns = this.downloadCampaigns.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
  }

  typeChange(newType) {
    if (this.state.campaigns.length > 1 || this.state.showForm) {
      const response = confirm("Changing the script type will clear your current campaigns. Are you sure?");
      if (!response) { return; }
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
        return LineItemScript.campaigns;
        break;
      case 'shipping':
        return ShippingScript.campaigns;
        break;
      case 'payment':
        return PaymentScript.campaigns;
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
    newState.showForm = true;
    const campaign = this.getCampaignById(campaignId);
    newState.currentCampaign = this.getCampaignInfo(campaign.name);
    newState.editCampaignInfo = campaign;
    newState.output = '';
    this.setState(newState);
  }

  removeCampaign(campaignId) {
    if (this.state.editCampaignInfo && this.state.editCampaignInfo.id === campaignId) {
      alert("You are currently editing this campaign. Save or discard changes first.");
      return;
    } else {
      const response = confirm("Are you sure you want to remove this campaign?");
      if (!response) { return; }
    }

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
    newState.showForm = boolean;
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
    newState.showForm = false;
    this.setState(newState);
  }

  generateScript() {
    if (this.state.showForm) {
      alert("Save or discard changes to the current campaign first.");
      return;
    }
    const newState = this.state;
    newState.showForm = false;
    let output = Common.classes;
    switch(this.state.scriptType) {
      case 'line_item':
        output += LineItemScript.classes;
        break;
      case 'shipping':
        output += ShippingScript.classes;
        break;
      case 'payment':
        output += PaymentScript.classes;
        break;
      default:
        console.warn("Invalid type");
    }
    output += this.generateCampaignsOutput();
    
    newState.output = output;
    this.setState(newState);
  }

  generateCampaignsOutput() {
    let output = null;
    let campaigns = null;
    switch(this.state.scriptType) {
      case 'line_item':
        campaigns = this.state.campaigns.map((campaign) => this.generateCode(campaign)).join();
        // remove the last `,` from the string (raises syntax error)
        campaigns = campaigns.substring(campaigns.length -1, 0);
        output = LineItemScript.defaultCode.replace('|', campaigns);
        break;
      case 'shipping':
        campaigns = this.state.campaigns.map((campaign) => this.generateCode(campaign)).join();
        // remove the last `,` from the string (raises syntax error)
        campaigns = campaigns.substring(campaigns.length -1, 0);
        output = ShippingScript.defaultCode.replace('|', campaigns);
        break;
      case 'payment':
        campaigns = this.state.campaigns.map((campaign) => this.generateCode(campaign)).join();
        // remove the last `,` from the string (raises syntax error)
        campaigns = campaigns.substring(campaigns.length -1, 0);
        output = PaymentScript.defaultCode.replace('|', campaigns);
        break;
      default:
        console.warn("Invalid type");
    }
    return output;
  }

  generateCode(campaign) {
    if (campaign.skip) { return; }
    const inputsCode = campaign.inputs.map((input, index) => {
      if (input.inputs) {
        return this.generateCode(input);
      } else if (typeof input === "object" && input.name !== "none") {
        return `${input.name}.new()`;
      } else if (typeof input === "object" && input.name === 'none') {
        return 'nil';
      } else {
        return `${input}`;
      }
    }).join(',\n');
    return `\
${campaign.name}.new(
${inputsCode}
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
        this.readFile(evt.target, (loadedCampaigns) => {
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
  }

  readFile(fileInput, callback) {
    // Create a reader object
    const reader = new FileReader();
    if (fileInput.files.length) {
      const textFile = fileInput.files[0];
      // Read the file
      reader.readAsText(textFile);
      // When it's loaded, process it
      reader.addEventListener('load', (evt) => {
        const result = this.processFile(evt);
        callback(result);
      });
    }
  }

  processFile(evt) {
    const file = evt.target.result;
    const validFileSignature = 'ShopifyScriptCreatorFile';
    let results = null;
    if (file && file.length) {
      results = file;
      if (results.indexOf(validFileSignature) > -1) {
        const fileVersion = results.split('ShopifyScriptCreatorFile-V')[1].split('-')[0];
        if (this.incompatibleVersions.indexOf(fileVersion) > -1) {
          alert('This file is from an older version of Shopify Script Creator and will not work with the current version');
        } else {
          const splitOn = /-V\d+\.\d+\.\d+-/;
          return JSON.parse(results.split(splitOn)[1]);
        }
      } else {
        alert('File does not appear to be a valid script creator file');
      }
    } else {
      alert('File does not appear to be a valid script creator file');
    }
    return null;
  }

  downloadCampaigns() {
    const filename = `SSC-V${this.version}-script-${parseInt(Math.random() * 100000000)}.txt`;
    const campaigns = this.state.campaigns.filter((campaign) => !campaign.skip);
    const data = `ShopifyScriptCreatorFile-V${this.version}-${JSON.stringify(campaigns)}`;
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

    const reportIssue = {
      content: 'Report an Issue',
      external: true,
      plain: true,
      url: 'https://github.com/jgodson/shopify-script-creator/issues/new' 
    }

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
        );
      } else {
        return (
          <EmptyState
            heading="Your script is ready to go! You can also add additional campaigns."
            action={{content: 'Generate script', onAction: this.generateScript}}
            secondaryAction={{content: 'Add another campaign', onAction: () => this.showForm(true)}}
          >
            <p>Add more campaigns to your script, or generate your script code now.</p>
          </EmptyState>
        );
      }
    };
    
    return (
      <Page title="Shopify Script Creator" secondaryActions={secondaryActions} primaryAction={reportIssue}>
        <Layout>
          <Layout.Section>
            <ScriptSelector changeType={this.typeChange} currentType={this.state.scriptType} />
            {this.state.showForm && 
              <CampaignForm
                currentCampaign={this.state.currentCampaign}
                availableCampaigns={this.state.availableCampaigns}
                updateCurrentCampaign={this.updateCurrentCampaign}
                addCampaign={this.addCampaign}
                showForm={this.showForm}
                existingInfo={this.state.editCampaignInfo}
              />
            }
            {this.state.output && <ScriptOutput output={this.state.output} />}
            {(!this.state.showForm && !this.state.output) && instructions()}
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
          secondaryActions={clear}
        />
        <Footer />
      </Page>
    );
  }
}

export default App;
