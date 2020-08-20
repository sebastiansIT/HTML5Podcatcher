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

/**
 * @constant {module:podcatcher/utils/logging.Logger}
 */
const LOGGER = new Logger('podcatcher/commands/client')
/**
 * Path to the "generic" worker that handles command requests.
 * @constant {external:String}
 */
const WORKER_URL = 'scripts/api/commands/worker.js'

/**
 * Client to send commands to a command processor.
 * The current implementation uses Web Workers as runtime for the commands
 * processors.
 * ATTENTION! At the moment each instance of a client can only be used to run
 * one single command. The different commands are not sepearatet completly in
 * the diffent event listeners!
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
     * @member {external:String}
     * @private
    */
    this._commandProcessorName = commandProcessorName

    /**
     * The instance of a Worker prozess the client comunicate with.
     * @member {external:Worker}
     * @private
     */
    this._worker = initWorker(this._commandProcessorName)

    /**
     * ATTENTION! Should be a different list per command and not for the whole
     * client instance.
     * @member {Array}
     * @private
     */
    this._eventListener = []
  }

  // Documenting promises: see https://github.com/jsdoc/jsdoc/issues/1197#issuecomment-312948746
  /**
   * A promise for the commands response.
   * @typedef {external:Promise<object>} CommandResponsePromise
   * @promise CommandResponsePromise
   * @fulfill {external:object} The awnser to the command.
   * @reject {external:ErrorEvent} An error thrown by the worker.
   * @reject {external:MessageEvent} A messageError thrown by the worker.
   */

  /**
   * Send a command to the command processor.
   * @param {external:String} command - The command to be called.
   * @param {external:object} [payload] - The data to work on.
   * @returns {CommandResponsePromise} A Promise that resolves with the result of the command.
   */
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
      const worker = this._worker
      worker.addEventListener('message', (event) => {
        // check if it is the "completed" message
        if (event.data.type === 'result') {
          worker.terminate()
          resolve(event.data)
        } else if (event.data.type === 'event') {
          this._eventListener.forEach((item, i) => {
            if (item.name === event.data.payload.name) {
              item.callback(event.data.payload.data)
            }
          })
        } else if (event.data.type === 'error') {
          worker.terminate()
          reject(event.data.payload)
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

  /**
   * Abort all running commands.
   * @returns {undefined}
   */
  abortAllRunningCommands () {
    LOGGER.debug('Terminate worker')
    this._worker.terminate()
    this._worker = initWorker(this._commandProcessorName)
  }

  addEventListener (name, callback) {
    this._eventListener.push({
      name: name,
      callback: callback
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
    LOGGER.debug(`Response for command: ${JSON.stringify(event.data)}`)
  }, false)
  worker.addEventListener('error', (error) => {
    LOGGER.error(`Error executing command: ${JSON.stringify(error)}`)
  }, false)
  worker.addEventListener('messageerror', (error) => {
    LOGGER.error(`Error parsing payload: ${JSON.stringify(error)}`)
  }, false)

  return worker
}

/**
 * Checks if the given string is a valid name for an command processor.
 * That means
 * <ul><li>it must be a String</li>
 * <li>it must be truthy</li></li></ul>.
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
