import React, {Component} from 'react';
import {Layout, Page, PageActions, EmptyState} from '@shopify/polaris';
import {ExportMinor, ImportMinor, ChatMajorMonotone} from '@shopify/polaris-icons';
import VersionBox from './components/VersionBox';
import Modal from './components/Modal';
import ScriptSelector from './components/ScriptSelector';
import CampaignForm from './components/CampaignForm';
import CampaignsList from './components/CampaignsList';
import ScriptOutput from './components/ScriptOutput';
import Footer from './components/Footer';
import ChangeLogContent from './components/ChangeLogContent';
import {minifyRuby} from './minifyRuby';
import {MAX_SCRIPT_LENGTH} from './constants';

import LineItemScript from './scripts/lineItem';
import ShippingScript from './scripts/shipping';
import PaymentScript from './scripts/payment';
import Common from './scripts/common';

import Versions from './versions';
import {meetsMinimumVersion, findIndexOf} from './helpers';

export default class App extends Component {
  constructor(props) {
    super(props);

    this.defaultState = {
      scriptType: 'line_item',
      showForm: false,
      currentCampaign: null,
      availableCampaigns: this.getCampaigns('line_item'),
      campaigns: [],
      currentId: 0,
      output: '',
      currentCount: 0,
      maxCount: MAX_SCRIPT_LENGTH,
      editCampaignInfo: null,
      modal: {
        isOpen: false,
        title: "",
        content: "",
        inputs: [],
        onClose: null,
        actions: []
      }
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
    this.duplicateCampaign = this.duplicateCampaign.bind(this);
    this.removeCampaign = this.removeCampaign.bind(this);
    this.updateCurrentCampaign = this.updateCurrentCampaign.bind(this);
    this.getCampaigns = this.getCampaigns.bind(this);
    this.getCampaignInfo = this.getCampaignInfo.bind(this);
    this.getCampaignById = this.getCampaignById.bind(this);
    this.readFile = this.readFile.bind(this);
    this.processFile = this.processFile.bind(this);
    this.showForm = this.showForm.bind(this);
    this.download = this.download.bind(this);
    this.prepareAndExportTo = this.prepareAndExportTo.bind(this);
    this.uploadFile = this.uploadFile.bind(this);
    this.loadImportedData = this.loadImportedData.bind(this);
    this.saveDataToStorage = this.saveDataToStorage.bind(this);
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.toggleCampaignActive = this.toggleCampaignActive.bind(this);
    this.setMinification = this.setMinification.bind(this);
    this.handleSort = this.handleSort.bind(this);
  }

  componentWillMount() {
    // Retrive from local storage and set state if anything is there
    const data = localStorage.getItem('lastState');
    if (!data) { return; }
    const result = this.processFile(data, true);
    this.loadImportedData(result);
  }

  componentDidMount() {
    // Show change log modal if different than last version
    const lastVersion = localStorage.getItem('lastVersion');
    if (this.version !== lastVersion) {
      this.openModal({
        title: `Version ${this.version} BETA release`,
        content: <ChangeLogContent newVersion={this.version} />,
        onClose: () => localStorage.setItem('lastVersion', this.version)
      });
    }
  }

  openModal(modalInfo) {
    const newState = this.state;
    const {title, content, inputs, onClose, actions} = modalInfo;
    newState.modal.isOpen = true;
    newState.modal.title = title;
    newState.modal.content = content;
    newState.modal.inputs = inputs;
    newState.modal.onClose = (returnData) => this.closeModal(onClose, returnData)
    newState.modal.actions = actions;
    this.setState(newState);
  }

  closeModal(onClose, returnData) {
    if (typeof onClose === 'function') {
      onClose(returnData);
    }
    this.setState({modal: {isOpen: false}});
  }

  typeChange(newType) {
    // Google Analytics
    gtag('event', 'typeButtonClick');

    if (this.state.campaigns.length > 0 || this.state.showForm) {
      const response = confirm("Changing the script type will clear your current campaigns. Are you sure?");
      if (!response) { return; }
    }

    // Google Analytics
    gtag('event', 'typeChange');

    const newState = JSON.parse(JSON.stringify(this.defaultState));
    newState.scriptType = newType;
    newState.availableCampaigns = this.getCampaigns(newType);
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

  getCampaigns(type) {
    switch(type) {
      case 'line_item':
        return LineItemScript.campaigns;
      case 'shipping':
        return ShippingScript.campaigns;
      case 'payment':
        return PaymentScript.campaigns;
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
    return this.state.campaigns.filter((campaign) => campaign.id === id)[0];
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

  duplicateCampaign(campaignId) {
    // Google Analytics
    gtag('event', 'duplicateButtonClick');

    const campaign = JSON.parse(JSON.stringify(this.getCampaignById(campaignId)));
    campaign.id = null;
    this.addCampaign(campaign);
  }

  toggleCampaignActive(campaignId) {
    const newState = this.state;
    const index = findIndexOf(newState.campaigns, (campaign) => campaign.id === campaignId);
    newState.campaigns[index].active = !this.state.campaigns[index].active;

    // If currently editing that campaign, lets change the state in the form as well
    if (this.state.editCampaignInfo && newState.editCampaignInfo.id === campaignId) {
      newState.editCampaignInfo.active = newState.campaigns[index].active;
    }

    newState.output = '';
    this.setState(newState);

    // Persist data in local storage
    this.prepareAndExportTo('localStorage');
  }

  handleSort(from, to) {
    if (from === to) {
      return;
    }

    const newState = this.state;
    const toBeMoved = newState.campaigns.splice(from, 1);
    newState.campaigns.splice(to, 0, ...toBeMoved);
    newState.output = '';
    this.setState(newState);

    // Persist data in local storage
    this.prepareAndExportTo('localStorage');
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
    const index = findIndexOf(this.state.campaigns, (campaign) => campaign.id === campaignId);
    newState.campaigns.splice(index, 1);
    newState.output = '';
    this.setState(newState);
    // Persist data in local storage
    this.prepareAndExportTo('localStorage');
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
    gtag('event', event);

    const newState = this.state;
    if (campaign.id === null) {
      campaign.id = this.state.currentId;
      newState.currentId = ++campaign.id;
      newState.campaigns.splice(newState.campaigns.length, 0, campaign);
    } else {
      const existingId = campaign.id
      const index = findIndexOf(this.state.campaigns, (campaign) => campaign.id === existingId);
      newState.campaigns.splice(index, 1, campaign);
    }
    newState.currentCampaign = null;
    newState.editCampaignInfo = null;
    newState.showForm = false;
    newState.output = '';
    this.setState(newState);

    // Persist data in local storage
    this.prepareAndExportTo('localStorage');
  }

  generateScript(minificationLevel = 0) {
    // Google Analytics
    gtag('event', 'generateButtonClick');

    if (this.state.showForm) {
      alert("Save or discard changes to the current campaign first.");
      return;
    }
    const newState = this.state;

    let output = this.generateCampaignsOutput();
    if (minificationLevel > 0) {
      const {result} = minifyRuby(output, {level: minificationLevel});
      output = result;
    } else {
      newState.savedCount = 0;
    }

    newState.showForm = false;
    newState.output = output;
    newState.currentCount = output.length;
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
    let campaigns = this.state.campaigns
      .filter((campaign) => campaign.active === true || campaign.active === undefined)
      .map((campaign) => {
        this.IL++;
        const code = this.generateCode(campaign, classesUsed, allClasses);
        this.IL--;
        return code;
      }).join(',\n');
    // remove the last `,` from the campaigns string (raises syntax error)
    campaigns = campaigns.substring(campaigns.length, 0);

    let output = generateClassCode(allClasses, classesUsed);
    // Remove first newline
    output = output.substring(1);

    // Replace the default code with the campaign initialization code
    output += defaultCode.replace('|', campaigns);
    return output;

    function generateClassCode(allClasses, classesUsed) {
      // Google Analytics
      const used = classesUsed.filter((name) => !name.match(/^(Selector|Qualifier|Campaign)$/)).join(', ');

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

  generateCode(campaign, classesUsed, allClasses) {
    if (campaign.skip) { return; }

    const INDENT = {
      1: '  ',
      2: '    ',
      3: '      ',
      4: '        ',
      5: '          ',
    };

    addUsedClass(campaign.name, allClasses);
    if (campaign.dependants) {
      campaign.dependants.forEach((dependant) => addUsedClass(dependant, allClasses));
    }

    const inputsCode = campaign.inputs.map((input, index) => {
      if (input.inputs) {
        this.IL++;
        const code = this.generateCode(input, classesUsed, allClasses);
        this.IL--;
        return code;
      } else if (typeof input === "object" && input.name !== "none") {
        addUsedClass(input.name, allClasses);
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

    function addUsedClass(className, allClasses) {
      // Grab what inherits from the class (if anything)
      let inheritsFrom;

      if (allClasses[className]) {
        inheritsFrom = allClasses[className].split('\n')[1];
      } else {
        throw Error(`Missing class ${className}`);
      }

      if (inheritsFrom.indexOf('<') > -1) {
        inheritsFrom = inheritsFrom.split('<')[1].trim();
        if (classesUsed.indexOf(inheritsFrom) === -1) {
          classesUsed.push(inheritsFrom);
        }
      }

      if (classesUsed.indexOf(className) === -1) {
        classesUsed.push(className);
      }
    }
  }

  download(data, filename, type) {
    data = JSON.stringify(data);
    const file = new Blob([data], {type});
    if (window.navigator.msSaveOrOpenBlob) {
      // IE10+
      window.navigator.msSaveOrOpenBlob(file, filename);
    } else {
      const link = document.createElement("a");
      const url = URL.createObjectURL(file);
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 10);
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

        this.readFile(evt.target, (results) => {
          if (this.loadImportedData(results)) {
            this.prepareAndExportTo('localStorage');
            // Google Analytics
            gtag('event', 'importSuccess');
          }
          document.body.removeChild(evt.target);
        });
      });
    }
    fileInput.click();
  }

  loadImportedData(data) {
    if (data && data.campaigns.length > 0) {
      const newState = JSON.parse(JSON.stringify(this.defaultState));
      if (data.type !== 'line_item') {
        newState.scriptType = data.type;
        newState.availableCampaigns = this.getCampaigns(data.type);
      }
      let loadedCampaigns = data.campaigns;
      loadedCampaigns.reverse().forEach((campaign) => {
        // Ignore old placeholder campaign from prior to V0.22.0 (had no id, so will be skipped here)
        if (campaign.id) {
          newState.campaigns.unshift(campaign);
        }
      });
      const newId = loadedCampaigns.sort((a, b) => b.id - a.id)[0].id + 1;
      newState.currentId = newId;

      this.setState(newState);
      return true;
    }
    return false;
  }

  saveDataToStorage(data) {
    if (!data) {
      localStorage.removeItem('lastState');
    } else {
      localStorage.setItem('lastState', JSON.stringify(data));
    }
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
        const result = this.processFile(evt.target.result);
        callback(result);
      });
    }
  }

  processFile(file, localData) {
    const validFileSignature = 'ShopifyScriptCreatorFile';
    let results = null;
    if (file && (localData || file.length)) {
      try {
        results = JSON.parse(file);
        if (results.version.indexOf(validFileSignature) < 0) { throw Error; }
        const fileVersion = results.version.split('ShopifyScriptCreatorFile-V')[1].split('-')[0];
        if (meetsMinimumVersion(fileVersion, this.minimumVersion)) {
          if (!results.type || !results.campaigns) { throw Error; }
          return results;
        } else {
          if (localData) {
            alert('The current saved data appears to be from an older version of Shopify Script Creator and will not work with the current version. This data will be cleared from storage.');
            this.saveDataToStorage(null);
          } else {
            alert('This file appears to be from an older version of Shopify Script Creator and will not work with the current version');
          }
        }
      } catch (error) {
        alert('File does not appear to be a valid script creator file');
      }
    } else {
      alert('File does not appear to be a valid script creator file');
    }
    return null;
  }

  prepareAndExportTo(exportType) {
    const filename = `SSC-V${this.version}-script-${parseInt(Math.random() * 100000000)}.txt`;
    const campaigns = this.state.campaigns.filter((campaign) => !campaign.skip);
    const data = {
      version: `ShopifyScriptCreatorFile-V${this.version}`,
      type: this.state.scriptType,
      campaigns: campaigns
    };

    switch (exportType) {
      case "file":
        // Google Analytics
        gtag('event', 'export');
        this.download(data, filename, 'text/plain');
        break;
      case 'localStorage':
        this.saveDataToStorage(data);
        break;
      default:
        return data;
    }
  }

  setMinification(level) {
    this.generateScript(level);
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
      content: 'Leave feedback',
      icon: ChatMajorMonotone,
      external: true,
      plain: true,
      url: 'https://docs.google.com/forms/d/e/1FAIpQLSdBHeVvdU92fc8vsqRuvx5uWuYQFsW8U3Co5HDIusH8YEH_VA/viewform'
    }

    const secondaryActions = [
      {
        content: 'Export campaigns',
        onAction: () => this.prepareAndExportTo('file'),
        icon: ExportMinor,
      },
      {
        content: 'Import campaigns',
        onAction: this.uploadFile,
        icon: ImportMinor,
      }
    ];

    const instructions = () => {
      if (this.state.campaigns.length === 0) {
        return (
          <EmptyState
            heading="Add your campaigns to generate a script"
            action={{content: 'Add campaign', onAction: () => this.showForm(true)}}
          >
            <p>Select a script type, add some campaigns and then click <strong>Generate script</strong> to generate script code to paste into the Script Editor app. Try adding a campaign first.</p>
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
        {this.state.modal.isOpen &&
          <Modal
            title={this.state.modal.title}
            content={this.state.modal.content}
            inputs={this.state.modal.inputs}
            isOpen={this.state.modal.isOpen}
            onClose={this.state.modal.onClose}
            actions={this.state.modal.actions}
          />
        }
        <VersionBox currentVersion={this.version} />
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
                openModal={this.openModal}
              />
            }
            {this.state.output && (
              <ScriptOutput
                output={this.state.output}
                setMinification={this.setMinification}
                currentCount={this.state.currentCount}
                maxCount={this.state.maxCount}
              />
            )}
            {(!this.state.showForm && !this.state.output) && instructions()}
          </Layout.Section>
          <Layout.Section secondary>
            <CampaignsList
              campaigns={this.state.campaigns}
              editCampaign={this.editCampaign}
              toggleActive={this.toggleCampaignActive}
              removeCampaign={this.removeCampaign}
              duplicateCampaign={this.duplicateCampaign}
              handleSort={this.handleSort}
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
