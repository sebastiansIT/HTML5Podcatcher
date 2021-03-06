/** This modul contains functions load informations and files from the internet.

    @module  HTML5Podcatcher/Web
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:HTML5Podcatcher/Configuration
    @license Copyright 2015, 2016 Sebastian Spautz

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

/* global document, navigator, XMLHttpRequest */
/* global HTML5Podcatcher */

var webAPI = (function () {
  'use strict'

  var createXMLHttpRequest, downloadXML, downloadArrayBuffer

  /** The `CompletedAjaxRequestCreationCallback` is called after the creation of a XMLHttpRequest object.
    *
    * @callback CompletedAjaxRequestCreationCallback
    * @param {XMLHttpRequest} request - The created XMLHttpRequest.
    */

  /** The `XHRProgressCallback` is called when a progress event of an XMLHttpRequest is fired.
    *
    * @callback XHRProgressCallback
    * @param {ProgressEvent} event - The progress event of the internal used XMLHttpRequest.
    * @param {URL} url - The URL of the file.
    */

  /** The `XMLLoadedCallback` is called after the succesful download of an XML document.
    *
    * @callback XMLLoadedCallback
    * @param {Document} xmlDocument - The loaded XML document.
    */

  /** The `ArryBufferLoadedCallback` is called after the succesful download of an file.
    *
    * @callback ArryBufferLoadedCallback
    * @param {ArrayBuffer} arrayBuffer - The loaded array buffer.
    */

  /** @summary Creates a XMLHttpRequest.
    * @desc Creates a 'normal' XMLHttpRequest in most cases. When called within a packaged FirefoxOS-App,
    * it creates a system request (mozSystem property) to avoid conflicts with the Same Origin Policy.
    * @public
    * @param {module:HTML5Podcatcher/Web~CompletedAjaxRequestCreationCallback} onCompletedCallback
    */
  createXMLHttpRequest = function (onCompletedCallback) {
    var ajaxRequest, appInfoRequest
    // Detection of installed open web apps
    // see https://developer.mozilla.org/en-US/Apps/Build/App_development_FAQ#How_can_I_detect_whether_an_app_is_privileged_or_certified.3F
    if (navigator.mozApps) {
      appInfoRequest = navigator.mozApps.getSelf()
      appInfoRequest.onsuccess = function () {
        if (appInfoRequest.result) {
          HTML5Podcatcher.logger(appInfoRequest.result.manifest.name + ' is a ' + appInfoRequest.result.manifest.type + ' app.', 'debug:Web')
          if (appInfoRequest.result.manifest.type === 'privileged' || appInfoRequest.result.manifest.type === 'certified') {
            ajaxRequest = new XMLHttpRequest({ mozSystem: true })
          } else {
            ajaxRequest = new XMLHttpRequest()
          }
        } else {
          ajaxRequest = new XMLHttpRequest()
        }
        onCompletedCallback(ajaxRequest)
      }
    } else {
      HTML5Podcatcher.logger("This Webapp isn't run in a Open-Web-App-Container.", 'debug:Web')
      ajaxRequest = new XMLHttpRequest()
      onCompletedCallback(ajaxRequest)
    }
  }

  /** Load an XML document from the given URL.
    * @deprecated
    * @param {URL} url - The URL to load.
    * @param {module:HTML5Podcatcher/Web~XMLLoadedCallback} [onLoadCallback] - Function that is called when the XML resource is successfuly loaded.
    * @param {function} [onFailureCallback] - Function that is called when a failure occured.
    */
  downloadXML = function (url, onLoadCallback, onFailureCallback) {
    var successfunction, errorfunction, proxyUrlPattern

    proxyUrlPattern = HTML5Podcatcher.api.configuration.proxyUrlPattern
    successfunction = function (event) {
      var ajaxCall = event.target
      var xmlData

      HTML5Podcatcher.logger('Download of "' + url + '" is finished', 'debug', 'Web')
      xmlData = ajaxCall.responseXML
      if (xmlData) {
        if (onLoadCallback && typeof onLoadCallback === 'function') {
          onLoadCallback(xmlData)
        }
      } else {
        HTML5Podcatcher.logger(`No XML Document found at ${url} instead found [' ${ajaxCall.response} ]`, 'error', 'Web')
      }
    }
    errorfunction = function (xhrError) {
      if (proxyUrlPattern) {
        HTML5Podcatcher.logger(`Direct download failed. Try proxy: ${proxyUrlPattern.replace('$url$', url)}`, 'info', 'Web')
        createXMLHttpRequest(function (proxyXhr) {
          proxyXhr.open('GET', proxyUrlPattern.replace('$url$', url), true)
          proxyXhr.addEventListener('error', function (xhrError) {
            HTML5Podcatcher.logger(`Can't download Source ${proxyUrlPattern.replace('$url$', url)}: ${xhrError.error}`, 'error', 'Web')
            if (onFailureCallback && typeof onFailureCallback === 'function') {
              onFailureCallback()
            }
          }, false)
          proxyXhr.addEventListener('abort', HTML5Podcatcher.logger, false)
          proxyXhr.onload = successfunction
          proxyXhr.ontimeout = function () {
            HTML5Podcatcher.logger(`Timeout after ${(proxyXhr.timeout / 60000)} minutes.`, 'error', 'Web')
            if (onFailureCallback && typeof onFailureCallback === 'function') {
              onFailureCallback()
            }
          }
          proxyXhr.send()
        })
      } else {
        HTML5Podcatcher.logger(`Can't download Source ${url}: ${xhrError.error}`, 'error', 'Web')
      }
    }

    // Load Feed and Parse Entries
    try {
      createXMLHttpRequest(function (xhr) {
        xhr.open('GET', url, true)
        xhr.addEventListener('error', errorfunction, false)
        xhr.addEventListener('abort', HTML5Podcatcher.logger, false)
        xhr.onload = successfunction
        xhr.ontimeout = function () {
          HTML5Podcatcher.logger('Timeout after ' + (xhr.timeout / 60000) + ' minutes.', 'error', 'Web')
          if (onFailureCallback && typeof onFailureCallback === 'function') {
            onFailureCallback()
          }
        }
        xhr.send()
      })
    } catch (exeption) {
      HTML5Podcatcher.logger(exeption, 'error', 'Web')
      if (onFailureCallback && typeof onFailureCallback === 'function') {
        onFailureCallback()
      }
    }
  }

  /** Load a file as an array buffer from the given URL.
    * @deprecated
    * @param {URL} url - The URL to load.
    * @param {module:HTML5Podcatcher/Web~ArryBufferLoadedCallback} [onLoadCallback] - Function that is called when the file (as an array buffer) is successfuly loaded.
    * @param {module:HTML5Podcatcher/Web~XHRProgressCallback} [onProgressCallback] - The callback funktion to notify the program about progress information.
    */
  downloadArrayBuffer = function (url, onLoadCallback, onProgressCallback) {
    var successfunction, errorfunction, progressfunction,
      proxyUrlPattern, downloadTimeout

    proxyUrlPattern = HTML5Podcatcher.api.configuration.proxyUrlPattern
    downloadTimeout = HTML5Podcatcher.api.configuration.downloadTimeout
    // Function called on progress events
    progressfunction = function (event) {
      var percentComplete

      if (event.lengthComputable) {
        // Downloaded Bytes / total Bytes
        percentComplete = event.loaded / event.total
        HTML5Podcatcher.logger('Download array buffer: ' + (percentComplete * 100).toFixed(2) + '%', 'debug', 'Web')
      } else {
        HTML5Podcatcher.logger('Downloading array buffer...', 'debug', 'Web')
      }

      if (onProgressCallback && typeof onProgressCallback === 'function') {
        onProgressCallback(event, url)
      }
    }
    // Function called after successful download
    successfunction = function (event) {
      var ajaxCall = event.target

      if (ajaxCall.status === 200) {
        HTML5Podcatcher.logger('Download of file "' + url + '" is finished', 'debug', 'Web')
        if (onLoadCallback && typeof onLoadCallback === 'function') {
          onLoadCallback(ajaxCall.response)
        }
      } else {
        HTML5Podcatcher.logger('Error Downloading file "' + url + '": ' + ajaxCall.statusText + ' (' + ajaxCall.status + ')', 'error', 'Web')
      }
    }
    // Function called when an error occured downloading the array buffer
    errorfunction = function (xhrError) {
      if (proxyUrlPattern) {
        HTML5Podcatcher.logger('Direct download failed. Try proxy: ' + proxyUrlPattern.replace('$url$', url), 'warn:Web')
        createXMLHttpRequest(function (xhrProxy) {
          xhrProxy.open('GET', proxyUrlPattern.replace('$url$', url), true)
          xhrProxy.responseType = 'arraybuffer'
          xhrProxy.timeout = downloadTimeout
          xhrProxy.addEventListener('progress', progressfunction, false)
          xhrProxy.addEventListener('abort', HTML5Podcatcher.logger, false)
          xhrProxy.addEventListener('error', function (xhrError) {
            HTML5Podcatcher.logger("Can't download File: " + xhrError.error, 'error:Web')
            HTML5Podcatcher.logger(xhrError, 'debug:Web')
          }, false)
          xhrProxy.onload = successfunction
          xhrProxy.ontimeout = function () {
            HTML5Podcatcher.logger('Timeout after ' + (xhrProxy.timeout / 60000) + ' minutes.', 'error:Web')
          }
          xhrProxy.send(null)
        })
      } else {
        HTML5Podcatcher.logger("Can't download Source " + url + ': ' + xhrError.error, 'error:Web')
      }
    }

    try {
      createXMLHttpRequest(function (xhr) {
        xhr.open('GET', url, true)
        xhr.responseType = 'arraybuffer'
        xhr.timeout = downloadTimeout
        xhr.addEventListener('progress', progressfunction, false)
        xhr.addEventListener('error', errorfunction, false)
        xhr.addEventListener('abort', () => HTML5Podcatcher.logger('Request for ' + url + ' aborted!', 'error', 'Web'), false)
        xhr.onload = successfunction
        xhr.ontimeout = function () {
          HTML5Podcatcher.logger('Timeout after ' + (xhr.timeout / 60000) + ' minutes.', 'error:Web')
        }
        xhr.send(null)
      })
    } catch (exeption) {
      HTML5Podcatcher.logger(exeption, 'error:Web')
    }
  }

  return {
    'createXMLHttpRequest': createXMLHttpRequest,
    'downloadXML': downloadXML,
    'downloadArrayBuffer': downloadArrayBuffer
  }
}())

/** The modul "Web" is available at document.HTML5Podcatcher.api.web.
  * @global
  * @name "HTML5Podcatcher.api.web"
  * @see module:HTML5Podcatcher/Web
  */
HTML5Podcatcher.api.web = webAPI
