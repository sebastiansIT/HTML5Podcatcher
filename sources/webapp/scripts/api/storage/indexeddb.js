/**
 * Implementation of an Storage for podcast source based on the
 * Indexed Database API.
 *
 * @module  podcatcher/storage/settings/localstorage
 * @requires module:podcatcher/utils/logging
 * @author  SebastiansIT [sebastian@human-injection.de]
 * @license GPL-3.0-or-later
 *
 * Copyright 2023 Sebastian Spautz
 *
 * This file is part of "HTML5 Podcatcher".
 *
    "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    any later version.
 *
    "HTML5 Podcatcher" is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */

/* global window, Promise */

import { Logger } from '../utils/logging.js'

/** Logger.
 *
 * @constant {module:podcatcher/utils/logging.Logger}
 * @private
 */
const LOGGER = new Logger('Storage/IndexedDB')
const NAME = 'HTML5Podcatcher'
const VERSION = 7

/**
 * Implementation of the Interface ISourcesProvider based on the HTML5
 * Indexed DB API.
 *
 * @class
 */
export default class IndexedDBStorageProvider {
  /**
   * Open the Database.
   *
   * @returns {Promise<IDBDatabase, Error>} A database connection.
   */
  openConnection () {
    return new Promise((resolve, reject) => {
      const requestOpenDB = window.indexedDB.open(NAME, VERSION)

      // TODO requestOpenDB.onupgradeneeded = this.updateIndexedDB

      requestOpenDB.onblocked = (/* event */) => {
        LOGGER.debug('Database blocked')
        reject(new Error(`Database "${NAME}" is blocked. Please try again later.`))
      }

      requestOpenDB.onerror = (event) => {
        LOGGER.error(`${event.target.error.name} creating/accessing IndexedDB database (${event.target.error.message})`)
        reject(event.target.error)
      }

      requestOpenDB.onsuccess = (event) => {
        LOGGER.debug('Success creating/accessing IndexedDB database')
        resolve(event.target.result)
      }
    })
  }

  /**
   * Close a given Database connection.
   *
   * @param {IDBDatabase} database The database connection to close.
   */
  closeConnection (database) {
    database.close()
  }

  /**
   * Starts a transaction to access a IndexedDB.
   *
   * @param {IDBDatabase} database
   * @param {string[]|string} stores
   * @param {string} mode
   * @param {object} options
   *
   * @returns {Promise<IDBTransaction, Error>} A transaction.
   */
  openTransaction (database, stores, mode = 'readonly', options = {}) {
    return new Promise((resolve, reject) => {
      try {
        const transaction = database.transaction(stores, mode, options)
        transaction.oncomplete = (event) => {
          LOGGER.info('Database transaction finished.')
        }
        transaction.onerror = (event) => {
          LOGGER.error('Error in database transaction.')
        }
        resolve(transaction)
      } catch (exception) {
        reject(exception)
      }
    })
  }
}
