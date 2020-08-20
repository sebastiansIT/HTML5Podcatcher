/** The HTML5Podcatcher Command Processor for episodes.

    @module  podcatcher/commands/episode/processor
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:podcatcher/utils/logging
    @requires module:podcatcher/commands/processor
    @requires module:podcatcher/web/fetch
    @requires module:podcatcher/storage
    @requires module:podcatcher/storage/indexeddb
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
import { BaseCommandProcessor } from '../processor.js'
import WebAccessProvider from '../../web/fetch.js'
import { StorageServiceProvider } from '../../storage/storage.js'
import { IndexedDbStorageService } from '../../storage/indexeddb.js'

/**
 * @constant {module:podcatcher/utils/logging.Logger}
 */
const LOGGER = new Logger('podcatcher/commands/episode/processor')

/**
 * @constant {module:podcatcher/storage.StorageServiceProvider}
 */
const FILE_STORAGE_SERVICE_PROVIDER = new StorageServiceProvider()
FILE_STORAGE_SERVICE_PROVIDER.register(new IndexedDbStorageService(), 500)
// TODO rewrite chrome file system storage service

/**
 * The payload of the downloadMedia command.
 * @typedef {external:object} DownloadEpisodeMediaPayload
 * @property {external:String} mediaUrl - The URL of the media file.
 * @property {external:String} sopProxyPattern - The pattern for the proxy URL.
 */

/**
 * Command processor to read and maniuplate informations about podcast episodes.
 * The command processor also contains commands for the handling of media files.
 * @augments module:podcatcher/commands/processor.BaseCommandProcessor
 */
class EpisodeCommandProcessor extends BaseCommandProcessor {
  /**
   * Instance of a WebAccessProvider to handle downloads of episode media files.
   * @member {module:podcatcher/web~WebAccessProvider} _webAccessProvider
   * @private
   */

  /**
   * Download a media file and save it to the configured storage.
   * @param {module:podcatcher/commands/episode/processor~DownloadEpisodeMediaPayload} payload - The parameter for the command "downloadMedia".
   * @param {Function} postEventMessage - Allows the command processor to send events to the caller.
   * @returns {module:podcatcher/storage/files/indexeddb~SaveFilePromise} A Promise downloading the media file.
   */
  downloadMedia (payload, postEventMessage) {
    LOGGER.debug(`Execute command to download media file for episode ${payload.episodeUrl}`)

    const progressEventHandler = (event, url) => {
      postEventMessage('progress', event)
    }

    // Late init web access provider
    if (!this._webAccessProvider) {
      this._webAccessProvider = new WebAccessProvider(payload.sopProxyPattern)
    }

    const promise = this._webAccessProvider
      .downloadArrayBuffer(payload.mediaUrl, progressEventHandler) // TODO should also returns the mime type
      .then((arrayBuffer) => {
        return FILE_STORAGE_SERVICE_PROVIDER.get().saveFile(payload.mediaUrl, arrayBuffer)
      })
      .then((databasekey) => {
        LOGGER.debug(`File ${payload.mediaUrl} saved to storage with key ${databasekey}.`)
        return databasekey
      })
      .catch((error) => {
        if (error instanceof DOMException) {
          LOGGER.info('Download aborted')
        } else {
          LOGGER.info(error)
        }
        throw error
      })

    return promise
  }
}

export default EpisodeCommandProcessor
