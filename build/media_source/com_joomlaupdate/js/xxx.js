import versionCompare from 'https://cdn.jsdelivr.net/npm/version-compare@1.1.0/edition-es5-esm/index.js';

class PreUpdateChecker {
  constructor() {
    const phpData = Joomla.getOptions('preupdate');
    if (!phpData) {
      throw new Error('Required data is missing, terminating!');
    }

    this.items = phpData.items;
    this.serverUrl = phpData.options.serverUrl;
    this.selector = phpData.options.selector;
    this.joomlaTargetVersion = phpData.options.joomlaTargetVersion;
    this.joomlaCurrentVersion = phpData.options.joomlaCurrentVersion;

    this.$ = document.querySelector.bind(document);
    this.$$ = document.querySelectorAll.bind(document);

    this.container = this.$('#preupdate-container');
    this.tableTemplate = this.$('#table-template').content;
    this.tableRowTemplate = this.$('#table-row-template').content;
    if (!this.container || !this.tableTemplate || !this.tableRowTemplate) {
      throw new Error('Required DOM elements are missing, terminating!');
    }
  }

  updateRow(row, item) {
    const td = row.querySelectorAll('td');
    td[0].textContent = item.name;
    td[1].textContent = item.type;
    // td[2].innerHTML = item.;
    // td[3].innerHTML = '';
    td[4].innerText = item.version;
  }

  /**
   * Run the sequence
   */
  run() {
    this.render();

    Object.keys(this.items).map((id) => this.checkCompatibility(this.items[id]));
  }

  /**
   * Render the results
   */
  render() {
    this.container.innerHTML = '';
    const table = this.tableTemplate.cloneNode(true);
    const tableBody = table.querySelector('tbody');

    Object.keys(this.items).forEach((id) => {
      const item = this.items[id];
      const row = this.tableRowTemplate.cloneNode(true);
      this.updateRow(row, item);
      tableBody.appendChild(row);
    });

    this.container.appendChild(table);
  }

  /**
   * Check the compatibility for a single extension.
   *
   * @param {object} extension
   */
  async checkCompatibility(extension) {
    // Request the server to check the compatiblity for the passed extension and joomla version
    try {
      const response = await fetch(this.serverUrl, {
        method: 'POST',
        body: {
          'joomla-target-version': this.joomlaTargetVersion,
          'joomla-current-version': this.joomlaCurrentVersion,
          'extension-version': extension.version,
          'extension-id': extension.id,
        },
        mode: 'cors',
        cache: 'no-cache',
        headers: { 'Content-Type': 'application/json' },
      });

      const resp = await response.json();

      Object.keys(this.items).forEach((index) => {
        if (this.items[index].id === extension.id) {
          this.items[index].currentCompatibilityStatus = resp.data.currentCompatibilityStatus;
          this.items[index].upgradeCompatibilityStatus = resp.data.upgradeCompatibilityStatus;
          this.items[index].resultGroup = resp.data.resultGroup;
          this.items[index].resultGroup = resp.data.resultGroup;
          this.items[index].upgradeWarning = resp.data.upgradeWarning;
          this.items[index].firstRun = false;
        }
      });

      this.render();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.log(err);
    }
  }
}

const extractionMethodHandler = (target, prefix) => {
  const element = document.querySelector(target);
  const displayStyle = (element.value === 'direct') ? 'none' : 'table-row';

  document.getElementById(`${prefix}_hostname`).style.display = displayStyle;
  document.getElementById(`${prefix}_port`).style.display = displayStyle;
  document.getElementById(`${prefix}_username`).style.display = displayStyle;
  document.getElementById(`${prefix}_password`).style.display = displayStyle;
  document.getElementById(`${prefix}_directory`).style.display = displayStyle;
};

document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('#extraction_method').addEventListener('change', () => {
    extractionMethodHandler('#extraction_method', 'row_ftp');
  });
  document.querySelector('#upload_method').addEventListener('change', () => {
    extractionMethodHandler('#upload_method', 'upload_ftp');
  });

  const button = document.querySelector('button.submit');
  if (button) {
    button.addEventListener('click', () => {
      [].slice.call(document.querySelectorAll('div.download_message'))
        .forEach((el) => { el.style.display = 'block'; });
    });
  }

  // Initialise the class
  const updateChecker = new PreUpdateChecker();

  // Run PreUpdateChecker
  if (updateChecker) {
    updateChecker.run();
  }
});


/**
 *     console.log(item)

 //versionCompare(current: Version, other: Version)
 //1 if current is greater than other, 0 if they are equal or equivalent, and -1 if current is less than other
 console.log(versionCompare('10.1.8', '10.0.4')); // return true
 console.log(versionCompare('10.0.1', '10.0.1')); // return true
 console.log(versionCompare('10.0.1-beta', '10.0.1')); // return false
 console.log(versionCompare('10.1.1', '10.2.2')); // return false
 console.log(versionCompare('10.1.1', '10.2.2')); // return false
 console.log(versionCompare('10.1.1', '10.2.2')); // return false

 */
/**
 * run()
 * [].slice.call(this.$$('.compatibilitytypes img')).map((el) => { el.style.height = '20px'; return el; });
 [].slice.call(this.$$('.compatibilitytypes')).map((el) => {
      el.style.display = 'none';
      el.style.marginLeft = 0;
      return el;
    });

 // The currently processing line should show until it’s finished
 this.$('#compatibilitytype0').style.display = 'block';
 this.$('.compatibilitytoggle').style.float = 'right';
 this.$('.compatibilitytoggle').style.cursor = 'pointer';

 [].slice.call(this.$$('.compatibilitytoggle')).forEach((el) => {
      el.addEventListener('click', (event) => {
        const element = event.target;
        const compatibilityTypes = element.closest('fieldset.compatibilitytypes');

        if (element.dataset.state === 'closed') {
          element.dataset.state = 'open';

          element.innerText = Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_SHOW_LESS_EXTENSION_COMPATIBILITY_INFORMATION');
          compatibilityTypes.querySelector('.exname').classList.remove('span8').classList.add('span4');
          compatibilityTypes.querySelector('.extype').classList.remove('span4').classList.add('span2');
          compatibilityTypes.querySelector('.upcomp').classList.remove('hidden').classList.add('span2');
          compatibilityTypes.querySelector('.currcomp').classList.remove('hidden').classList.add('span2');
          compatibilityTypes.querySelector('.instver').classList.remove('hidden').classList.add('span2');

          if (this.showYellowWarning) {
            compatibilityTypes.querySelector('#updateyellowwarning').classList.remove('hidden');
          }
          if (this.showOrangeWarning) {
            compatibilityTypes.querySelector('#updateorangewarning').classList.remove('hidden');
          }
        } else {
          element.dataset.state = 'closed';

          element.innerText = Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_SHOW_MORE_EXTENSION_COMPATIBILITY_INFORMATION');
          compatibilityTypes.querySelector('.exname').classList.add('span8').classList.remove('span4');
          compatibilityTypes.querySelector('.extype').classList.add('span4').classList.remove('span2');
          compatibilityTypes.querySelector('.upcomp').classList.add('hidden').classList.remove('span2');
          compatibilityTypes.querySelector('.currcomp').classList.add('hidden').classList.remove('span2');
          compatibilityTypes.querySelector('.instver').classList.add('hidden').classList.remove('span2');

          compatibilityTypes.querySelector('#updateyellowwarning').classList.add('hidden');
          compatibilityTypes.querySelector('#updateorangewarning').classList.add('hidden');
        }
      });
    });

 // Grab all extensions based on the selector set in the config object
 // Check compatibility for each extension, pass object and a callback
 // function after completing the request
 [].slice.call(this.$$(this.selector))
 .map((el) => this.checkCompatibility(el));
 */

/**

 /**
 * Set the result for a passed extensionData object containing state,
 * object and compatible version
 *
 * @param {Object} extensionData
 *
 setResultView(extensionData) {
  let html = '';

  // Process Target Version Extension Compatibility
  if (extensionData.serverError) {
    // An error occurred -> show unknown error note
    html = Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_SERVER_ERROR');
  } else {
    // Switch the compatibility state
    switch (extensionData.compatibilityData.upgradeCompatibilityStatus.state) {
      case this.state.compatible:
        if (extensionData.compatibilityData.upgradeWarning) {
          html = `<span class="label label-warning">${extensionData.compatibilityData.upgradeCompatibilityStatus.compatibleVersion}</span>`;
          this.showYellowWarning = true;
        } else {
          html = extensionData.compatibilityData.upgradeCompatibilityStatus.compatibleVersion === false ? Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_NO_COMPATIBILITY_INFORMATION') : extensionData.compatibilityData.upgradeCompatibilityStatus.compatibleVersion;
        }
        break;
      case this.state.incompatible:
        // No compatible version found -> display error label
        html = Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_NO_COMPATIBILITY_INFORMATION');
        this.showOrangeWarning = true;
        break;
      case this.state.missingCompatibilityTag:
        // Could not check compatibility state -> display warning
        html = Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_NO_COMPATIBILITY_INFORMATION');
        this.showOrangeWarning = true;
        break;
      default:
        // An error occured -> show unknown error note
        html = Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_WARNING_UNKNOWN');
    }
  }
  // Insert the generated html
  extensionData.element.innerHTML = html;

  // Process Current Version Extension Compatibility
  html = '';
  if (extensionData.serverError) {
    // An error occured -> show unknown error note
    html = Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_SERVER_ERROR');
  } else {
    // Switch the compatibility state
    switch (extensionData.compatibilityData.currentCompatibilityStatus.state) {
      case this.state.compatible:
        html = extensionData.compatibilityData.currentCompatibilityStatus.compatibleVersion === false ? Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_NO_COMPATIBILITY_INFORMATION') : extensionData.compatibilityData.currentCompatibilityStatus.compatibleVersion;
        break;
      case this.state.incompatible:
        // No compatible version found -> display error label
        html = Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_NO_COMPATIBILITY_INFORMATION');
        break;
      case this.state.missingCompatibilityTag:
        // Could not check compatibility state -> display warning
        html = Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_NO_COMPATIBILITY_INFORMATION');
        break;
      default:
        // An error occured -> show unknown error note
        html = Joomla.Text._('COM_JOOMLAUPDATE_VIEW_DEFAULT_EXTENSION_WARNING_UNKNOWN');
    }
  }
  // Insert the generated html
  const { extensionId } = extensionData.element.dataset;
  console.log(extensionData);
  document.getElementById(`available-version-${extensionId}`).innerHTML = html;

  debugger;
  const node = extensionData.element.closest('tr').cloneNode(true);
  document.querySelector(`#compatibilitytype${extensionData.compatibilityData.resultGroup} tbody`).appendChild(node);
  document.querySelector(`#compatibilitytype${extensionData.compatibilityData.resultGroup}`).style.display = 'block';

  document.getElementById('compatibilitytype0').style.display = 'block';

  // Have we finished?
  if (this.$$('#compatibilitytype0 tbody td').length === 0) {
    document.querySelector('#compatibilitytype0').style.display = 'none';
  }
}
 **/
