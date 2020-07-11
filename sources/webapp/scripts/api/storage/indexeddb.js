/** This modul contains an implementation of a StorageService based on IndexedDB.

    @module  podcatcher/storage/indexeddb
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @license Copyright 2020 Sebastian Spautz
    @requires module:podcatcher/storage
    @requires module:podcatcher/utils/logging
    @requires module:podcatcher/storage/episodes/indexeddb
    @requires module:podcatcher/storage/sources/indexeddb
    @requires module:podcatcher/storage/files/indexeddb

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

/* globals indexedDB */

import { StorageService } from './storage.js'
import { updateIndexedDb as updateEpisodeStorage } from './episodes/indexeddb.js'
import { updateIndexedDb as updateSourceStorage } from './sources/indexeddb.js'
import { updateIndexedDb as updateFileStorage, saveFile } from './files/indexeddb.js'
import { Logger } from '../utils/logging.js'

/** Logger.
  * @constant {module:podcatcher/utils/logging.Logger}
  */
const LOGGER = new Logger('podcatcher/storage/indexeddb')

/**
 * Implements a StorageService based on IndexedDB.
 */
export class IndexedDbStorageService extends StorageService {
  /**
   * Creates a StorageService using the database with the given name and version.
   * @param {string} [databaseName=HTML5Podcatcher] - The name of the database to use.
   * @param {number} [databaseVersion=7] - The version of the database to use.
   */
  constructor (databaseName, databaseVersion) {
    super()
    /**
     * The database name.
     * @type {string}
     * @private
     */
    this._databaseName = databaseName || 'HTML5Podcatcher'
    /**
     * The database version.
     * @type {number}
     * @private
     */
    this._databaseVersion = databaseVersion || 7
  }

  get compatible () {
    return !!indexedDB
  }

  /**
   * A promise for a opend database connection.
   * @typedef {external:Promise<external:IDBDatabase>} OpenConnectionPromise
   * @promise OpenConnectionPromise
   * @fulfill {external:IDBDatabase} A connection to the configured database.
   * @reject If something goes wrong.
   */

  /** Opens a database connection.
   * @protected
   * @returns {module:podcatcher/storage/indexeddb~OpenConnectionPromise} A promise that fullfiled with a database connection.
   */
  openDatabase () {
    return new Promise((resolve, reject) => {
      /* @type https://developer.mozilla.org/en-US/docs/Web/API/IDBOpenDBRequest */
      const openDbRequest = indexedDB.open(this._databaseName, this._databaseVersion)
      openDbRequest.onupgradeneeded = updateIndexedDB
      openDbRequest.onblocked = (event) => {
        LOGGER.debug('Database blocked')
        reject(event)
      }
      openDbRequest.onsuccess = (event) => {
        LOGGER.debug('Success creating/accessing IndexedDB database')
        resolve(event.target.result)
      }
      openDbRequest.onerror = (event) => {
        LOGGER.error(event.target.error.name + ' creating/accessing IndexedDB database (' + event.target.error.message + ')')
        reject(event.target.error)
      }
    })
  }

  /**
   * Safe a file to the indexeddb.
   * @param {string} url - The URL of the file to store inside IndexedDB.
   * @param {external:ArrayBuffer} content - An array buffer containing the content of the file.
   * @param {string} [mimeType=audio/mpeg] - The MIME-Type of the File.
   * @returns {module:podcatcher/storage/files/indexeddb~SaveFilePromise} A promise that fullfiled with the database key of the saved file.
   */
  saveFile (url, content, mimeType) {
    return saveFile(this, url, content, mimeType)
  }
}

/**
 * Creates or update all internals of a indexeddb to read and write objects needed by this application.
 * @param {external:IDBVersionChangeEvent} event - The version change event.
 * @returns {undefined}
 */
function updateIndexedDB (event) {
  LOGGER.info(`Database Update from Version ${event.oldVersion} to Version ${event.newVersion}`)
  const connection = this.result

  updateSourceStorage(connection)
  updateEpisodeStorage(connection)
  updateFileStorage(connection)
}
