/** Logger that show messages in the UI.

    @module  h5p/utils/logging/uilogger
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires HTML5PodcatcherAPI
    @license Copyright 2019 Sebastian Spautz

    This file is part of "HTML5 Podcatcher".

    "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    any later version.

    "HTML5 Podcatcher" is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see http://www.gnu.org/licenses/.
*/

/** A log appender that shows the messages onto the ui.
  * @class
  * @augments @external:AbstractLogAppender
  */
export class UiLogAppender {
  // TODO parametrisied html ids
  // TODO extract logger for status bar

  /** Creates a HTML paragraph element with the log message and append it to
    * the ui. Also replaces the last message in the status bar with the new
    * message.
    * @param {external:String} message The log message.
    * @param {external:String} logLevelName The level of the message.
    * @param {external:String} module The source of the message.
    * @returns {undefined}
    */
  logMessage (message, logLevelName, module) {
    switch (logLevelName) {
      case 'fatal':
        document.getElementById('logView').classList.add('fullscreen')
        break
    }

    // Add message to the log window
    const logEntryNode = document.createElement('p')
    logEntryNode.className = logLevelName
    logEntryNode.appendChild(document.createTextNode(message))
    if (document.getElementById('log')) {
      document.getElementById('log').insertBefore(logEntryNode, document.getElementById('log').firstChild)
    }

    // Add message to the status bar
    if (document.getElementById('activeMessage') && logLevelName !== 'debug' && logLevelName !== 'info') {
      const messageNode = document.getElementById('activeMessage')
      while (messageNode.hasChildNodes()) {
        messageNode.removeChild(messageNode.lastChild)
      }
      messageNode.appendChild(logEntryNode.cloneNode(true))
    }
  }
}
