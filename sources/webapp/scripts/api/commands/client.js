/** The HTML5Podcatcher Command Client.

    @module  podcatcher/commands/client
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:podcatcher/utils/logging
    @license Copyright 2020 Sebastian Spautz

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

/* globals Worker */

import { Logger } from '../utils/logging.js'

const LOGGER = new Logger('podcatcher/commands/client')
const WORKER_URL = 'scripts/api/commands/worker.js'

/**
 * Client to send commands to a command processor.
 * The current implementation uses Web Workers.
 */
export class CommandClient {
  /**
   * Creates a new client for the given command processor.
   * @param {external:String} commandProcessorName - The name of the javascript file
   * exposing a command processor to the global scope.
   * Must not be null, undefined or an empty string.
   */
  constructor (commandProcessorName) {
    checkCommandProcessorName(commandProcessorName)
    /**
     * The javascript file name of the command porcessor.
     * @private
     * @type {external:String}
    */
    this._commandProcessorName = commandProcessorName
  }

  /**
   * Send a command to the command processor.
   * @param {external:String} command - The command to be called.
   * @param {external:Object} [payload] - The data to work on.
   * @returns {external:Promise} A Promise that resolves with the result of the command.
   */
  // TODO document Promise
  call (command, payload) {
    // check parameter command exists and is a string
    if (!command || typeof command !== 'string') {
      throw new Error(`Name of the command must be a string but is a ${typeof command}.`)
    }
    // transform null, undefined payload to empty object
    if (payload === undefined) {
      payload = {}
    } else if (typeof payload !== 'object') {
      throw new Error(`Payload for the command must be a object but is a ${typeof command}.`)
    }

    return new Promise((resolve, reject) => {
      const worker = initWorker(this._commandProcessorName)
      worker.addEventListener('message', (event) => {
        // TODO check if it is the "completed" message
        if (event.data.complete) {
          worker.terminate()
          resolve(event.data)
        }
      }, false)
      worker.addEventListener('error', (error) => {
        reject(error)
      }, false)
      worker.addEventListener('messageerror', (error) => {
        reject(error)
      }, false)
      worker.postMessage({
        command: command,
        payload: payload
      })
    })
  }
}

/**
 * Initialise a Worker and add some default event listener to log out the
 * messages and errors.
 * @private
 * @param {external:String} commandProcessorName - The name of the javascript file
 * exposing a command processor to the global scope.
 * Must not be null, undefined or an empty string.
 * @returns {external:Worker} The Worker.
 */
function initWorker (commandProcessorName) {
  checkCommandProcessorName(commandProcessorName)

  const worker = new Worker(WORKER_URL, { name: commandProcessorName })
  worker.addEventListener('message', (event) => {
    LOGGER.debug(`Response for command ${JSON.stringify(event.data)}`)
  }, false)
  worker.addEventListener('error', (error) => {
    LOGGER.error(`Error executing command ${JSON.stringify(error)}`)
  }, false)
  worker.addEventListener('messageerror', (error) => {
    LOGGER.error(`Error parsing payload ${JSON.stringify(error)}`)
  }, false)

  return worker
}

/**
 * Checks if the given string is a valid name for an command processor.
 * 
 * @private
 * @param {external:String} commandProcessorName - The name of the javascript file
 * exposing a command processor to the global scope.
 * Must be a string.
 * Must not be null, undefined or an empty string.
 * @throws {external:Error} An error if it isn't a valid name.
 * @returns {undefined}
 */
function checkCommandProcessorName (commandProcessorName) {
  if (!commandProcessorName) {
    throw new Error(`Name of the command processor must not be ${commandProcessorName}`)
  }
}

// TODO zwischenmeldungen
// TODO verarbeitung abbrechen
