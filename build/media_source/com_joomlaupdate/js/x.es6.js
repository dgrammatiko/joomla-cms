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
