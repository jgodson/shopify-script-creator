import React, {Component} from 'react';
import { Layout, Page, PageActions, EmptyState } from '@shopify/polaris';
import ScriptSelector from './components/ScriptSelector';
import CampaignForm from './components/CampaignForm';
import CampaignsList from './components/CampaignsList';
import ScriptOutput from './components/ScriptOutput';
import Footer from './components/Footer';

import LineItemScript from './scripts/lineItem';
import ShippingScript from './scripts/shipping';
import PaymentScript from './scripts/payment';
import Common from './scripts/common';

import Versions from './versions';
import { meetsMinimumVersion } from './helpers';

export default class App extends Component {
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

    // Indent level for script output
    this.IL = 0;

    // Versions used for saving script files to detect imcompatabilities
    this.version = Versions.currentVersion;
    this.minimumVersion = Versions.minimumVersion;

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
    // Google Analytics
    gtag('event', 'typeButtonClick');

    if (this.state.campaigns.length > 1 || this.state.showForm) {
      const response = confirm("Changing the script type will clear your current campaigns. Are you sure?");
      if (!response) { return; }
    }

    // Google Analytics
    gtag('event', 'typeChange', {'type' : newType});

    const newState = JSON.parse(JSON.stringify(this.defaultState));
    newState.scriptType = newType;
    newState.availableCampaigns = this.getCampagins(newType);
    this.setState(newState);
  }

  reset() {
    // Google Analytics
    gtag('event', 'resetButtonClick');

    const response = confirm("Are you sure you want to clear your work and start over?");
    if (response) {
      // Google Analytics
      gtag('event', 'reset')

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
    return this.state.availableCampaigns.find((campaign) => campaign.value === name);
  }

  getCampaignById(id) {
    return this.state.campaigns.find((campaign) => campaign.id === id);
  }

  editCampaign(campaignId) {
    // Google Analytics
    gtag('event', 'editButtonClick');

    const newState = this.state;
    newState.showForm = true;
    const campaign = this.getCampaignById(campaignId);
    newState.currentCampaign = this.getCampaignInfo(campaign.name);
    newState.editCampaignInfo = campaign;
    newState.output = '';
    this.setState(newState);
  }

  removeCampaign(campaignId) {
    // Google Analytics
    gtag('event', 'removeButtonClick');

    if (this.state.editCampaignInfo && this.state.editCampaignInfo.id === campaignId) {
      alert("You are currently editing this campaign. Save or discard changes first.");
      return;
    } else {
      const response = confirm("Are you sure you want to remove this campaign?");
      if (!response) { return; }
    }

    // Google Analytics
    gtag('event', 'removeCampaign');

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
    // Google Analytics
    const event = campaign.id ? 'editCampaign' : 'addCampaign';
    gtag('event', event, {'name': campaign.name});

    const newState = this.state;
    if (campaign.id === null) {
      campaign.id = this.state.currentId;
      newState.currentId = ++campaign.id;
      newState.campaigns.splice(newState.campaigns.length - 1, 0, campaign);
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
    // Google Analytics
    gtag('event', 'generateButtonClick', {'campaigns': this.state.campaigns.length - 1});

    if (this.state.showForm) {
      alert("Save or discard changes to the current campaign first.");
      return;
    }
    const newState = this.state;
    newState.showForm = false;
    newState.output = this.generateCampaignsOutput();
    this.setState(newState);
  }

  generateCampaignsOutput() {
    let defaultCode = null;
    const classesUsed = [];
    const allClasses = {};
    // Reset the indent level
    this.IL = 0;
    
    switch(this.state.scriptType) {
      case 'line_item':
        Object.assign(allClasses, Common.classes, LineItemScript.classes);
        defaultCode = LineItemScript.defaultCode;
        break;
      case 'shipping':
        Object.assign(allClasses, Common.classes, ShippingScript.classes);
        defaultCode = ShippingScript.defaultCode;
        break;
      case 'payment':
        Object.assign(allClasses, Common.classes, PaymentScript.classes);
        defaultCode = PaymentScript.defaultCode;
        break;
      default:
        throw Error('Invalid script type');
    }

    // Generate the campaign initialization code (also finds out what classes are used)
    let campaigns = this.state.campaigns.map((campaign) => {
      this.IL++;
      const code = this.generateCode(campaign, classesUsed);
      this.IL--;
      return code;
    }).join(',\n');
    // remove the last `,` from the campaigns string (raises syntax error)
    campaigns = campaigns.substring(campaigns.length -1, 0);

    // Generate the classes code
    let output = Common.requiredClasses + '\n';
    output += generateClassCode(allClasses, classesUsed);

    // Replace the default code with the campaign initialization code
    output += defaultCode.replace('|', campaigns);
    return output;

    function generateClassCode(allClasses, classesUsed) {
      // Google Analytics
      gtag('event', 'scriptGenerated', {'usedClasses': classesUsed});

      let code = '';
      classesUsed.forEach((className) => {
        if (allClasses[className]) {
          code += allClasses[className] + '\n';
        } else {
          throw Error(`Missing class ${className}`);
        }
      });
      return code;
    }
  }

  generateCode(campaign, classesUsed) {
    if (campaign.skip) { return; }

    const INDENT = {
      1: '  ',
      2: '    ',
      3: '      ',
      4: '        '
    };

    addUsedClass(campaign.name);
    if (campaign.dependants) {
      campaign.dependants.forEach((dependant) => addUsedClass(dependant));
    }

    const inputsCode = campaign.inputs.map((input, index) => {
      if (input.inputs) {
        this.IL++;
        const code = this.generateCode(input, classesUsed);
        this.IL--;
        return code;
      } else if (typeof input === "object" && input.name !== "none") {
        addUsedClass(input.name);
        return `${INDENT[this.IL + 1]}${input.name}.new()`;
      } else if (typeof input === "object" && input.name === 'none') {
        return `${INDENT[this.IL + 1]}nil`;
      } else {
        return `${INDENT[this.IL + 1]}${input}`;
      }
    }).join(',\n');

    return `\
${INDENT[this.IL]}${campaign.name}.new(
${inputsCode}
${INDENT[this.IL]})`;

    function addUsedClass(className) {
      if (classesUsed.indexOf(className) === -1) {
        classesUsed.push(className);
      }
    }
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
    // Google Analytics
    gtag('event', 'importButtonClick');

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
        // Google Analytics
        gtag('event', 'importAttempt');

        this.readFile(evt.target, (loadedCampaigns) => {
          if (loadedCampaigns && loadedCampaigns.length > 0) {
            const newState = JSON.parse(JSON.stringify(this.defaultState));
            loadedCampaigns.reverse().forEach((campaign) => {
              newState.campaigns.unshift(campaign);
            });
            const newId = loadedCampaigns.sort((a, b) => a.id - b.id)[0].id + 1;
            newState.currentId = newId;
            
            // Google Analytics
            gtag('event', 'importSuccess', {'campaigns': newState.campaigns.length - 1});

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
        if (meetsMinimumVersion(fileVersion, this.minimumVersion)) {
          const splitOn = /-V\d+\.\d+\.\d+-/;
          return JSON.parse(results.split(splitOn)[1]);
        } else {
          alert('This file is from an older version of Shopify Script Creator and will not work with the current version');
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
    // Google Analytics
    gtag('event', 'export', {'campaigns': this.state.campaigns.length - 1});

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
        content: 'Export campaigns',
        onAction: this.downloadCampaigns,
        icon: 'export'
      },
      {
        content: 'Import campaigns',
        onAction: this.uploadFile,
        icon: 'import'
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
        <div className="beta-tag"><a href="https://github.com/jgodson/shopify-script-creator/releases">ALPHA {this.version}</a></div>
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
            <CampaignsList
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
