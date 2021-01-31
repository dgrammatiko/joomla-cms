/**
 * @copyright   (C) 2018 Open Source Matters, Inc. <https://www.joomla.org>
 * @license     GNU General Public License version 2 or later; see LICENSE.txt
 */
Joomla = window.Joomla || {};

class JoomlaUpdate {
  constructor(options) {
    this.updateReturnUrl = options.updateReturnUrl;
    this.joomlaUpdatePassword = options.joomlaUpdatePassword || '';
    this.joomlaUpdateAjaxUrl = options.joomlaUpdateAjaxUrl;

    // Initialise the state
    this.task = 'ping';
    this.statusProgress = 0;
    this.processedFiles = 0;
    this.receivedBytes = 0;
    this.processedBytes = 0;
    this.totalSize = 0;
    this.state = {
      initialised: false,
      started: false,
      completed: false,
      finalised: false,
    };
  }

  /**
   * Start the process
   */
  begin() {
    this.doEncryptedAjax();
  }

  /**
   * Determine the task
   *
   * @returns {string}
   */
  getTask() {
    if (!this.state.initialised) {
      return this.task;
    }

    this.task = this.state.started ? 'stepRestore' : 'startRestore';
    this.state.started = true;

    if (this.state.finalised && this.state.completed) {
      this.task = null;
      return this.task;
    }

    if (this.state.started && this.state.completed) {
      this.task = 'finalizeRestore';
      this.state.finalised = true;
      return this.task;
    }

    return this.task;
  }

  /**
   * Update the UI and the store
   *
   * @param resp
   */
  handleResponse(resp) {
    let message;
    let junk;
    // Get rid of junk before the data
    const junkIndex = resp.indexOf('###');

    if (junkIndex === -1) {
      // Valid data not found in the response
      this.throwAlert(`Invalid AJAX data:
${message}`);

      return;
    }

    if (junkIndex !== 0) {
      // Data is prefixed with junk
      junk = message.substr(0, junkIndex);
      message = message.substr(junkIndex);
    } else {
      message = message;
    }

    // Remove triple hash in the beginning
    message = message.substr(3);

    // Get of rid of junk after the data
    // Remove triple hash in the end
    message = message.substr(0, message.lastIndexOf('###'));

    // Decrypt if required
    let data = null;
    if (this.joomlaUpdatePassword.length > 0) {
      try {
        data = JSON.parse(message);
      } catch (err) {
        message = window.AesCtr.decrypt(message, this.joomlaUpdatePassword, 128);
      }
    }

    try {
      if (this.isEmpty(data)) {
        data = JSON.parse(message);
      }
    } catch (err) {
      this.throwAlert(`${err.message.toUpperCase()}:
<pre><code>${message}</code></pre>`);
    }

    this.updateUI();
  }

  updateUI() {
    if (data.done) {
      this.finalizeUpdate();
    } else {
      // Add data to variables
      this.receivedBytes += data.bytesIn;
      this.statusProgress = (this.receivedBytes * 100) / this.totalSize;

      // Update GUI
      this.processedBytes += data.bytesOut;
      this.processedFiles += data.files;

      if (this.statusProgress < 100) {
        const pgElement = document.querySelector('#progress-bar');
        pgElement.style.width = `${this.statusProgress}%`;
        pgElement.setAttribute('aria-valuenow', this.statusProgress);
      } else if (this.statusProgress > 100) {
        this.statusProgress = 100;
        const pgElement = document.querySelector('#progress-bar');
        pgElement.style.width = `${this.statusProgress}%`;
        pgElement.setAttribute('aria-valuenow', this.statusProgress);
      } else {
        const pgElement = document.querySelector('#progress-bar');
        pgElement.classList.remove('bar-success');
      }

      document.querySelector('#extpercent').text(`${this.statusProgress.toFixed(1)}%`);
      document.querySelector('#extbytesin').text(this.receivedBytes);
      document.querySelector('#extbytesout').text(this.processedBytes);
      document.querySelector('#extfiles').text(this.processedFiles);
    }
  }

  async doEncryptedAjax() {
    const task = this.getTask();

    let json = JSON.stringify(data);
    if (this.joomlaUpdatePassword.length > 0) {
      json = window.AesCtr.encrypt(json, this.joomlaUpdatePassword, 128);
    }

    try {
      const response = await fetch(this.joomlaUpdateAjaxUrl, {
        type: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow',
        // body: JSON.stringify(data)
        body: { json },
      });

      const resp = await response.text();

      const data = this.handleResponse(resp);

      if (!this.state.completed) {
        this.doEncryptedAjax();
      } else {
        window.location = this.updateReturnUrl;
      }
    } catch (error) {
      this.throwAlert(`AJAX Loading Error: ${error}`);
    }
  }

  stepExtract(data) {
    if (!data.status) {
      // handle failure
      this.throwAlert(data.message);

      return;
    }

    if (!this.empty(data.Warnings)) {
      // @todo Handle warnings
    }

    if (data.factory) {
      this.extractFactory = data.factory;
    }
  }

  finalize() {
    // Do AJAX post
    const post = {
      task: 'finalizeRestore',
      factory: window.factory,
    };

    this.doEncryptedAjax(post, () => {
      window.location = this.updateReturnUrl;
    });
  }

  /**
   * Method to check emptyness
   *
   * @param   {mixed}  mixedVar  The variable
   *
   * @returns  boolean
   */
  static isEmpty(value) {
    if (value === ''
      || value === 0
      || value === '0'
      || value === null
      || value === false
      || typeof value === 'undefined'
      || (typeof value === 'object' && value.length === 0)
    ) {
      return true;
    }

    return false;
  }

  static throwAlert(value) {
    alert(
      `ERROR:
${value}`,
    );
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const JoomlaUpdateOptions = Joomla.getOptions('joomlaupdate');

  if (JoomlaUpdateOptions && JoomlaUpdateOptions.length) {
    const update = new JoomlaUpdate({
      password: JoomlaUpdateOptions.password,
      totalsize: JoomlaUpdateOptions.totalsize,
      updateAjaxUrl: JoomlaUpdateOptions.ajax_url,
      updateReturnUrl: JoomlaUpdateOptions.return_url,
    });

    update.begin();
  }
});
