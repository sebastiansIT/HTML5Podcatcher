/** The HTML5Podcatcher Command Processor.

    @module  podcatcher/commands/processor
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

import { Logger } from '../utils/logging.js'

const LOGGER = new Logger('podcatcher/commands/processor')

// TODO Document Interface "CommandProzessor"

/**
 * Base for all command prozessors.
 * @abstract
 */
export class BaseCommandProcessor {
  /**
   * Creates a new command prozessor.
   * @param {external:WorkerGlobalScope} workerScope - Global scope of the worker prozess.
   */
  constructor (workerScope) {
    this._worker = workerScope
  }

  /**
   * Command "diagnostic" awnsers with the workers name and location.
   * @returns {Promise<object>} The workers name and path to the javascript file.
   */
  diagnostic () {
    LOGGER.debug('Command "diagnostic" is called')
    return new Promise((resolve, reject) => {
      resolve({
        name: this._worker.name,
        url: this._worker.location.toString()
      })
    })
  }

  /** Command "echo" awnsers with the commands payload.
   * @param {external:Object} payload - Some data.
   * @returns {Promise<external:Object>} A promise resolving with the payload.
   */
  echo (payload) {
    LOGGER.debug('Command "echo" is called')
    return new Promise((resolve, reject) => {
      resolve(payload)
    })
  }

  /** Command "close" closes the web worker silently.
   * @returns {null} Returns nothing.
   */
  close () {
    this._worker.close()
    LOGGER.debug(`Worker ${this._worker.name} is closed.`)
    return null
  }
}
