/*  Copyright 2019 Sebastian Spautz

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

/* global self */

/**
  * @module HTML5Podcatcher/worker/utils/workerlogger
  */

/**
  * @class
  */
class WorkerLogger {
  /**
    * @constructor
    * @param {https://developer.mozilla.org/en-US/docs/Web/API/Client[]} [clients] - The Worker-Clients that get notivied about new log entries
    * @returns {WorkerLogger}
    */
  constructor (clients) {
    this.clients = clients || []
  }

  log (message, logLevelName, tag) {
    // Defaults
    tag = tag || self.location.pathname

    // Send message to Clients of the worker
    this.clients.forEach(client => {
      client.postMessage({
        'command': 'messageLog',
        'message': [message, logLevelName, tag]
      })
    })

    // Log to the console
    message = `Module ${tag} says: ${message}`
    switch (logLevelName) {
      case 'debug':
        console.debug(message)
        break
      case 'info':
        console.info(message)
        break
      case 'note':
        console.info(message)
        break
      case 'warn':
        console.warn(message)
        break
      case 'error':
        console.error(message)
        break
      case 'fatal':
        console.error(message)
        break
      default:
        console.log(`${logLevelName}: ${message}`)
    }
  }
}

self.WorkerLogger = WorkerLogger
