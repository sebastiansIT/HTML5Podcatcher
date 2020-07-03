/** This modul contains basics for implementation of an web access provider.
    Such a provider allows access to ressources in the internet.

    @module  podcatcher/web
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @license Copyright 2019, 2020 Sebastian Spautz

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

/** More an Interface than a abstract class defines it all necessary methods to
  * access the internet.
  * @abstract
  */
class WebAccessProvider {
  /**
    * Creates a new client for access of web ressources via the given proxy.
    * @constructs
    * @param {external:String|null|undefined} [sopProxyPattern] - A URL pattern used for access via a proxy.
    */
  constructor (sopProxyPattern) {
    this.sopProxyPattern = sopProxyPattern
  }

  /**
    * The "Same Origin Policy Proxy URL Pattern".
    * If the access to a URL fails and "sopProxyPattern" is set the Provider
    * start another try. For this second try a new URL is
    * generated from the pattern. In this new URL the placeholder $ulr$ is
    * replaced by the URL to call.
    * @type {external:String|null}
    */
  set sopProxyPattern (pattern) {
    this._sopProxyPattern = pattern || null
  }

  get sopProxyPattern () {
    return this._sopProxyPattern
  }

  /** Load a XML document from the internet.
    * @abstract
    * @param {external:String} url - A URL to load a XML document from.
    * @returns {module:podcatcher/web~DownloadXmlDocumentPromise} A promise that fullfiled
    * with an XML document or rejects if there is a network error or a HTTP
    * status code other than 200.
    */
  downloadXML (url) {
    return Promise.reject(new Error('Not Implemented'))
  }

  /**
   * Load a binary document from the internet.
   * @abstract
   * @param {external:String} url - A URL to load a binary document from.
   * @param {module:podcatcher/web~DownloadProgressCallback} [onProgressCallback] - A callback function to send progress informations.
   * @returns {module:podcatcher/web~DownloadArrayBufferPromise} A promise that fullfiled with an ArrayBuffer
   * or rejects if there is a network error or a HTTP status code other than 200.
   */
  downloadArrayBuffer (url, onProgressCallback) {
    return Promise.reject(new Error('Not Implemented'))
  }

  /**
   * Aborts an ongoing download.
   * @abstract
   * @param {external:String} url - Abort the download for this URL.
   * @throws {external:Error} Throws if there is no ongoing download for the given URL.
   * @returns {undefined}
   */
  abort (url) {
    throw new Error('Call abstract, not implemented method WebAccessProvider.abort(url).')
  }

  /**
   * Checks the given URL-String for validity.
   * @protected
   * @param {external:String} url - A URL to check for validity.
   * @throws {external:Error} An error if the URL isn't valid.
   */
  checkUrlParameter (url) {
    url = url.trim()
    if (!url || typeof url !== 'string') {
      throw new Error(`The URL must be a string but is a ${typeof url}.`)
    }
  }

  /**
   * Checks the given callback function for validity.
   * @protected
   * @param {Function} callback - A callback function.
   * @throws {external:Error} An error if the callback isn't a function.
   */
  checkProgressCallbackParameter (callback) {
    if (callback && typeof callback !== 'function') {
      throw new Error(`The progress callback must be a function but is a ${typeof callback}.`)
    }
  }
}

/**
 * A callback function that can handle progress events of an download.
 * @callback DownloadProgressCallback
 * @param {object} event - The progress event.
 * @param {number} event.loaded - The amount of data currently transfered.
 * @param {number} event.total - The total amount of data to be transferred.
 * @param {boolean} [event.approximated] - True if the value for total is approximated.
 * @param {external:String} url - The URL of the ressource download is in progress.
 */

/**
  * A promise for a XML document.
  * @typedef {external:Promise<external:XMLDocument>} DownloadXmlDocumentPromise
  * @promise DownloadXmlDocumentPromise
  * @fulfill {external:ArrayBuffer} The downloaded file as an XML document.
  * @reject {external:ErrorEvent} An error thrown by the web access provider.
  */

/**
 * A promise for the download response.
 * @typedef {external:Promise<external:ArrayBuffer>} DownloadArrayBufferPromise
 * @promise DownloadArrayBufferPromise
 * @fulfill {external:ArrayBuffer} The downloaded file as an ArrayBuffer.
 * @reject {external:ErrorEvent} An error thrown by the web access provider.
 */

export default WebAccessProvider
