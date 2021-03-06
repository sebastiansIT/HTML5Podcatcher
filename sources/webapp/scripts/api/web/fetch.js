/** This modul contains functions load informations and files from the
 * internet via Fetch API.
 *
    @module podcatcher/web/fetch
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:podcatcher/web
    @requires module:podcatcher/utils/logging
 * @license GPL-3.0-or-later
 *
 * Copyright 2021 Sebastian Spautz
 *
 * This file is part of "HTML5 Podcatcher".
 *
 * "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * "HTML5 Podcatcher" is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */
import WebAccessProvider from './web.js'
import { Logger } from '../utils/logging.js'

/* global fetch, Response, ReadableStream */

/** Represents a HTTP response in the fetch API.
 *
 * @external Response
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/Response|Response}
 */

/** Logger.
 *
 * @constant {module:podcatcher/utils/logging.Logger}
 * @private
 */
const LOGGER = new Logger('Web/Fetch')

/** Implements methods to access the internet based on fetch API.
 *
 * @class FetchWebAccessProvider
 * @augments module:podcatcher/web~WebAccessProvider
 * @param {external:String} [sopProxyPattern] A URL pattern used for access via a proxy.
 */
export default class FetchWebAccessProvider extends WebAccessProvider {
  /** Downloads a XML file.
   *
   * @param {string} url The URL of the XML file.
   * @returns {external:Promise} A promise downloading the file.
   */
  downloadXML (url) {
    const fetchViaProxy = function (error) {
      if (this.sopProxyPattern) {
        // insert URL into pattern and try again
        const proxyUrl = this.sopProxyPattern.replace('$url$', url)
        LOGGER.info(`Direct download failed. Try proxy: ${proxyUrl}`)
        return fetch(proxyUrl)
          .then(extractBodyTextFromResponse)
          .catch((error) => {
            LOGGER.error(`Can't download XML ${proxyUrl}: ${error.message}`)
            throw error
          })
      } else {
        LOGGER.error(`Can't download XML ${url}: ${error.message}`)
        throw error
      }
    }.bind(this)

    return fetch(url)
      .then(extractBodyTextFromResponse, fetchViaProxy)
      .then((text) => parseXmlFromText(text, url))
      .then((xmlDoc) => {
        LOGGER.debug(`Download of ${url} finished`)
        return xmlDoc
      })
  }

  /** Download a JSON file.
   *
   * @param {string} url The URL of the XML file.
   * @returns {external:Promise} A promise downloading the file.
   */
  downloadJson (url) {
    const extractJson = (response) => {
      if (response.ok) {
        return response.json()
      } else {
        throw new Error(`${response.status}: ${response.statusText}`)
      }
    }

    const fetchViaProxy = function (error) {
      if (this.sopProxyPattern) {
        // insert URL into pattern and try again
        const proxyUrl = this.sopProxyPattern.replace('$url$', url)
        LOGGER.info(`Direct download failed. Try proxy: ${proxyUrl}`)
        return fetch(proxyUrl)
          .then(extractJson)
          .catch((error) => {
            LOGGER.error(`Can't download JSON ${proxyUrl}: ${error.message}`)
            throw error
          })
      } else {
        LOGGER.error(`Can't download JSON ${url}: ${error.message}`)
        throw error
      }
    }.bind(this)

    return fetch(url)
      .then(extractJson, fetchViaProxy)
      .then(json => {
        LOGGER.debug(`Download of ${url} finished`)
        return json
      })
  }

  // Set Timeout from Settings noch nötig? scheibar nicht!
  // Progress Events
  // TODO abort? AbourtController (siehe https://stackoverflow.com/questions/46946380/fetch-api-request-timeout)
  // responseType = arraybuffer nötig? Scheinbar nicht!
  /** Download a binary file.
   *
   * @param {string} url The URL of the XML file.
   * @param {Function} onProgressCallback A Callback for changes in download progress.
   * @returns {external:Promise} A Promise downloading the file.
   */
  downloadArrayBuffer (url, onProgressCallback) {
    const fetchViaProxy = function (error) {
      if (this.sopProxyPattern) {
        // insert URL into pattern and try again
        const proxyUrl = this.sopProxyPattern.replace('$url$', url)
        LOGGER.info(`Direct download failed. Try proxy: ${proxyUrl}`)
        return fetch(proxyUrl)
          .then((response) => sendProgressEvents(response, onProgressCallback))
          .catch((error) => {
            LOGGER.error(`Can't download binary file ${proxyUrl}: ${error.message}`)
            throw error
          })
      } else {
        LOGGER.error(`Can't download binary file ${url}: ${error.message}`)
        throw error
      }
    }.bind(this)

    return fetch(url)
      .then((response) => sendProgressEvents(response, onProgressCallback), fetchViaProxy)
      .then((response) => response.arrayBuffer())
      .then((arrayBuffer) => {
        LOGGER.debug(`Download of ${url} finished`)
        return arrayBuffer
      })
  }
}

/** Check if the Response is OK and returns the content from the body if it so.
 *
 * @private
 * @param {external:Response} response The respone to a HTTP request.
 * @returns {external:String} The text of a HTTP response.
 * @throws {external:Error} Throws an error if the response isn't OK.
 */
function extractBodyTextFromResponse (response) {
  if (response.ok) {
    return response.text()
  } else {
    throw new Error(`${response.status}: ${response.statusText}`)
  }
}

/** Check if the Response is OK and returns a new response generated by a
 * reader from the fetched response. For each chunk of the reader progress
 * informations are send to the UI.
 *
 * @private
 * @param {external:Response} response The respone to a HTTP request.
 * @param {Function} onProgressCallback A Callback for changes in download progress.
 * @returns {external:Response} A new Response with the same body content.
 * @throws {external:Error} Throws an error if the response isn't OK or a
 *   error occured while handling the Stream.
 */
function sendProgressEvents (response, onProgressCallback) {
  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`)
  }
  // Following Code is inspired by https://github.com/AnthumChris/fetch-progress-indicators/blob/master/fetch-basic/supported-browser.js
  const contentLength = response.headers.get('content-length')
  if (!contentLength) {
    LOGGER.info(`No content length available in response to ${response.url}`)
    return response
  }

  const fileSizeTotalBytes = parseInt(contentLength, 10)
  let loadedBytes = 0

  return new Response(
    new ReadableStream({
      /** Start reading the stream.
       *
       * @param {object} controller The streams controller.
       */
      start (controller) {
        /** Read a chunk from the stream. */
        function read () {
          reader.read()
            .then(({ done, value }) => {
              if (done) {
                controller.close()
                return
              }
              loadedBytes += value.byteLength
              const percentComplete = loadedBytes / fileSizeTotalBytes
              LOGGER.debug('Download array buffer: ' + (percentComplete * 100).toFixed(2) + '%')
              if (onProgressCallback && typeof onProgressCallback === 'function') {
                onProgressCallback({ loaded: loadedBytes, total: fileSizeTotalBytes }, response.url)
              }
              controller.enqueue(value)
              read()
            }).catch(error => {
              LOGGER.error(`Error downloading File with progress informations: ${error}`)
              controller.error(error)
              throw error
            })
        }

        const reader = response.body.getReader()
        read()
      }
    })
  )
}

/** Parses the given text as XML.
 *
 * @private
 * @param {external:String} text The body of a HTTP request.
 * @param {external:String} url The target URL of the HTTP request.
 * @returns {external:XMLDocument} A XML document.
 * @throws {external:Error} Throws an Error when the response body can't parsed as XML.
 */
function parseXmlFromText (text, url) {
  const doc = (new window.DOMParser()).parseFromString(text, 'application/xml')
  if (doc.documentElement.querySelector('parsererror')) {
    LOGGER.error(`No XML Document found at ${url} instead found [' ${text} ]`)
    throw new Error(`No XML Document found at ${url}`)
  } else {
    return doc
  }
}
