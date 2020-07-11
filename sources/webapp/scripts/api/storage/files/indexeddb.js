/** This module contains functions for persistency of files
    based on IndexedDB.

    @module  podcatcher/storage/files/indexeddb
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

import { Logger } from '../../utils/logging.js'

/** Logger.
  * @constant {module:podcatcher/utils/logging.Logger}
  */
const LOGGER = new Logger('podcatcher/storage/files/indexeddb')

/** Name of the database "table" to store files in.
 * @constant {string}
 */
const STORE_NAME_FILES = 'files'

/** Size of a chunk readed form an array buffer.
 * @constant {number}
 */
const CHUNK_SIZE = 1024 * 1024 // 1 MByte

/**
  * A promise for saving a file.
  * @typedef {external:Promise<string>} SaveFilePromise
  * @promise SaveFilePromise
  * @fulfill {string} The key of the File, normaly the URL of it.
  * @reject {external:DOMException} If something goes wrong putting the file into the store.
  * See {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBObjectStore/put| MDN} for details.
  * @reject {external:DOMException} If something goes wrong accessing the IndexedDB store for files.
  * See {@link https://developer.mozilla.org/en-US/docs/Web/API/IDBTransaction/objectStore| MDN} for details.
  */

/**
 * Saves a file inside of a IndexedDB.
 * @param {module:podcatcher/storage/indexeddb~IndexedDbStorageService} service - A StorageService providing a funktion openDatabase().
 * @param {string} url - The URL of the file to store inside IndexedDB.
 * @param {external:ArrayBuffer} content - An array buffer containing the content of the file.
 * @param {string} [mimeType=audio/mpeg] - The MIME-Type of the File.
 * @returns {module:podcatcher/storage/files/indexeddb~SaveFilePromise} A promise that fullfiled with the database key of the saved file.
 */
export function saveFile (service, url, content, mimeType) {
  let blob, i
  mimeType = mimeType || 'audio/mpeg'

  LOGGER.debug(`Saving file "${url}" with type "${mimeType}" to IndexedDB starts now`)

  if (content instanceof ArrayBuffer) {
    const chunkArray = []
    for (i = 0; i < content.byteLength; i += CHUNK_SIZE) {
      if (i + CHUNK_SIZE < content.byteLength) {
        chunkArray.push(content.slice(i, i + CHUNK_SIZE))
      } else {
        chunkArray.push(content.slice(i))
      }
    }
    blob = new Blob(chunkArray, { type: mimeType })
  } else if (content instanceof Blob) {
    blob = content
  }

  return service.openDatabase()
    .then((connection) => {
      const transaction = connection.transaction([STORE_NAME_FILES], 'readwrite')
      const store = transaction.objectStore(STORE_NAME_FILES)
      const request = store.put(blob, url)
      request.onsuccess = function () {
        return url
      }
      request.onerror = function (event) {
        LOGGER.error(event.target.error.name + ' while saving file "' + url + '" to IndexedDB (' + event.target.error.message + ')')
        throw new Error(event.target.error)
      }
    })
}

/**
 * Creates or update all internals of a indexeddb to handle with files.
 * @param {external:IDBDatabase} connection - The database connection.
 * @returns {undefined}
 */
export function updateIndexedDb (connection) {
  // Add object store for Files
  if (!connection.objectStoreNames.contains(STORE_NAME_FILES)) {
    connection.createObjectStore(STORE_NAME_FILES, {})
  }
}
