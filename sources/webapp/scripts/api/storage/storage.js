/** Defines some basic classes to implement services to access storages on top of it.
    In addition an provider to handle multipel implementations of such services is exposed.

    @module  podcatcher/storage
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

/** Logger.
  * @constant {module:podcatcher/utils/logging.Logger}
  */
const LOGGER = new Logger('podcatcher/storage')

/**
 * More a interface than a class defines Storage Service the basics for all
 * storage services.
 * @abstract
 */
export class StorageService {
  /**
   * Is this storage service is compatible to the actual runtime system?
   * Runtime can be either a browser or a server environment.
   * @abstract
   * @type {boolean}
   * @readonly
   */
  get compatible () {
    throw new Error('Not Implemented')
  }

  /**
   * Is this storage servie usable in the actual situation?
   * @type {boolean}
   * @readonly
   */
  get usable () {
    return true
  }
}

/**
 * This Provider contains a registry for storage service implementations
 * and provide on of them compatible and usable.
 */
export class StorageServiceProvider {
  /**
    * Initialise an empty registry for storage services.
    */
  constructor () {
    /**
     * @private
     * @type {module:podcatcher/storage~RegistryEntry[]}
     * @default An Empty Array.
     */
    this._registry = []
  }

  /**
   * Register an storage service if it is compatible.
   * @param {module:podcatcher/storage.StorageService} storageService - The storage service to register.
   * @param {number} priority - The priority of the service.
   * @returns {undefined}
   */
  register (storageService, priority) {
    if (typeof storageService !== 'object') {
      throw new Error(`The storage serivce must be a instance of StorageService but is a ${typeof storageService}.`)
    } else if (!(storageService instanceof StorageService)) {
      throw new Error(`The storage serivce must be a instance of StorageService but is of ${storageService.constructor.name}.`)
    }
    if (typeof priority !== 'number') {
      throw new Error(`The priority must be a number but is a ${typeof priority}.`)
    }

    if (storageService.compatible) {
      this._registry.push(new RegistryEntry(storageService, priority))
    } else {
      LOGGER.warn(`The storage service ${storageService.toString()} is incompatible and will be ignored.`)
    }
  }

  /**
   * Provide the usable storage service with the highest priority.
   * @returns {module:podcatcher/storage.StorageService} A usable storage service.
   * @throws {external:Error} An error if no usable service available.
   */
  provide () {
    let selectedServiceEntry
    this._registry.forEach(serviceEntry => {
      if (serviceEntry.service.usable) {
        if (!selectedServiceEntry || selectedServiceEntry.priority < serviceEntry.priority) {
          selectedServiceEntry = serviceEntry
        }
      }
    })

    if (selectedServiceEntry) {
      return selectedServiceEntry.service
    } else {
      throw new Error('No storage service available.')
    }
  }
}

/**
 * Represents that combination of a storage service and the coresponding priority.
 * @package
 */
class RegistryEntry {
  /**
   * Creates an entry from a given service and priority.
   * @param {module:podcatcher/storage.StorageService} service - A storage service.
   * @param {number} priority - A priority mapped to the storage service.
   */
  constructor (service, priority) {
    this._service = service
    this._priority = priority
  }

  /**
   * The storage service.
   * @type {module:podcatcher/storage.StorageService}
   * @readonly
   */
  get service () {
    return this._service
  }

  /**
   * The priority.
   * @type {number}
   * @readonly
   */
  get priority () {
    return this._priority
  }
}
