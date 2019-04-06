/** This modul contains functions load informations and files from the internet.

    @module  podcatcher/web/xhr
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:podcatcher/web
    @requires module:podcatcher/utils/logging
    @license Copyright 2015, 2016, 2019 Sebastian Spautz

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
/* global XMLHttpRequest */

import WebAccessProvider from './web.js'
import { Logger } from '../utils/logging.js'

/** Logger
  * @constant {module:podcatcher/utils/logging.Logger}
  * @private
  */
const LOGGER = new Logger('Web/XHR')

/** Implements methods to access the internet based on XMLHttpRequest.
  * @class XhrWebAccessProvider
  * @augments module:podcatcher/web~WebAccessProvider
  * @param {external:String} [sopProxyPattern] A URL pattern used for access via a proxy.
  * @param {Object} [options] A Object with options used by this implementation of the WebAccessProvider.
  * @param {number} [options.downloadTimeout=600000] The  time in milliseconds to wait for finishing a network requests Default is 10 Minutes.
  */
export default class XhrWebAccessProvider extends WebAccessProvider {
  /**
    * @constructs module:podcatcher/web/xhr~XhrWebAccessProvider
    * @param {external:String} [sopProxyPattern] A URL pattern used for access via a proxy.
    * @param {Object} [options] A Object with options used by this implementation of the WebAccessProvider.
    * @param {number} [options.downloadTimeout=600000] The  time in milliseconds to wait for finishing a network requests Default is 10 Minutes.
    */
  constructor (sopProxyPattern, options) {
    super(sopProxyPattern, options)

    this.downloadTimeout = 600000
    if (options && options.downloadTimeout) {
      this.downloadTimeout = options.downloadTimeout
    }
  }

  downloadXML (url) {
    return new Promise((resolve, reject) => {
      const successfunction = function (event) {
        const ajaxCall = event.target

        LOGGER.debug(`Download of ${url} is finished`)
        const xmlData = ajaxCall.responseXML
        if (xmlData) {
          resolve(xmlData)
        } else {
          LOGGER.error(`No XML Document found at ${url} instead found [ ${ajaxCall.response} ]`)
          reject(new Error(`No XML Document found at ${url} instead found [ ${ajaxCall.response} ]`))
        }
      }
      const errorfunction = function (xhrError) {
        if (this.sopProxyPattern) {
          const PROXY_URL = this.sopProxyPattern.replace('$url$', url)
          LOGGER.info(`Direct download failed. Try proxy: ${PROXY_URL}`)
          const proxyXhr = new XMLHttpRequest()
          proxyXhr.open('GET', PROXY_URL, true)
          proxyXhr.addEventListener('error', function (proxyXhrError) {
            LOGGER.error(`Can't download Source ${PROXY_URL}: ${proxyXhrError.error}`)
            reject(proxyXhrError)
          }, false)
          proxyXhr.addEventListener('abort', (event) => reject(event), false)
          proxyXhr.onload = successfunction
          proxyXhr.ontimeout = function (event) {
            LOGGER.error(`Timeout after ${(proxyXhr.timeout / 60000)} minutes.`)
            reject(event)
          }
          proxyXhr.send()
        } else {
          const ERROR = `Can't download Source ${url}: ${xhrError.error}`
          LOGGER.error(ERROR)
          reject(new Error(ERROR))
        }
      }.bind(this)

      try {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', url, true)
        xhr.addEventListener('error', errorfunction, false)
        xhr.addEventListener('abort', (event) => reject(event), false)
        xhr.onload = successfunction
        xhr.ontimeout = function (event) {
          LOGGER.error(`Timeout after ${(xhr.timeout / 60000)} minutes.`)
          reject(event)
        }
        xhr.send()
      } catch (error) {
        LOGGER.error(error)
        reject(error)
      }
    })
  }

  downloadArrayBuffer (url, onProgressCallback) {
    return new Promise((resolve, reject) => {
      // Function called on progress events
      const progressfunction = function (event) {
        var percentComplete

        if (event.lengthComputable) {
          // Downloaded Bytes / total Bytes
          percentComplete = event.loaded / event.total
          LOGGER.debug(`Download array buffer: ${(percentComplete * 100).toFixed(2)}%`)
        } else {
          LOGGER.debug('Downloading array buffer...')
        }

        if (onProgressCallback && typeof onProgressCallback === 'function') {
          onProgressCallback(event, url)
        }
      }
      // Function called after successful download
      const successfunction = function (event) {
        var ajaxCall = event.target

        if (ajaxCall.status === 200) {
          LOGGER.debug(`Download of file ""${url}" is finished`)
          resolve(ajaxCall.response)
        } else {
          const ERROR = `Error Downloading file "${url}": ${ajaxCall.statusText} ${ajaxCall.status})`
          LOGGER.error(ERROR)
          reject(new Error(ERROR))
        }
      }
      // Function called when an error occured downloading the array buffer
      const errorfunction = function (xhrError) {
        if (this.sopProxyPattern) {
          const PROXY_URL = this.sopProxyPattern.replace('$url$', url)
          LOGGER.warning(`Direct download failed. Try proxy: ${PROXY_URL}`)

          const xhrProxy = new XMLHttpRequest()
          xhrProxy.open('GET', PROXY_URL, true)
          xhrProxy.responseType = 'arraybuffer'
          xhrProxy.timeout = this.downloadTimeout
          xhrProxy.addEventListener('progress', progressfunction, false)
          xhrProxy.addEventListener('abort', (event) => {
            LOGGER.error(`Request for ${PROXY_URL} aborted!`)
            reject(event)
          }, false)
          xhrProxy.addEventListener('error', function (xhrError) {
            LOGGER.error(`Can't download File: ${xhrError.error}`)
            LOGGER.debug(xhrError)
          }, false)
          xhrProxy.onload = successfunction
          xhrProxy.ontimeout = function () {
            LOGGER.error(`Timeout after ${xhrProxy.timeout / 60000} minutes.`)
          }
          xhrProxy.send(null)
        } else {
          const ERROR_MESSAGE = `Can't download Source ${url}: ${xhrError.error}`
          LOGGER.error(ERROR_MESSAGE)
          reject(new Error(ERROR_MESSAGE))
        }
      }.bind(this)

      try {
        const xhr = new XMLHttpRequest()
        xhr.open('GET', url, true)
        xhr.responseType = 'arraybuffer'
        xhr.timeout = this.downloadTimeout
        xhr.addEventListener('progress', progressfunction, false)
        xhr.addEventListener('error', errorfunction, false)
        xhr.addEventListener('abort', (event) => {
          LOGGER.error(`Request for ${url} aborted!`)
          reject(event)
        }, false)
        xhr.onload = successfunction
        xhr.ontimeout = function () {
          LOGGER.error(`Timeout after ${xhr.timeout / 60000} minutes.`)
        }
        xhr.send(null)
      } catch (exeption) {
        reject(exeption)
      }
    })
  }
}
