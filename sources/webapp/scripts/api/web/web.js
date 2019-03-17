/** This modul contains functions load informations and files from the internet.

    @module  podcatcher/web
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @license Copyright 2019 Sebastian Spautz

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
/**
  * The built in promise class.
  * @external Promise
  * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise|Promise}
  */
/**
  * The built in XmlDocument class.
  * @external XMLDocument
  * @see {@link https://developer.mozilla.org/en-US/docs/Web/API/XMLDocument|XmlDocument}
  */
/**
  * The built in array buffer class.
  * @external ArrayBuffer
  * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/ArrayBuffer|ArrayBuffer}
  */
/**
  * The built in error object.
  * @external Error
  * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error|Error}
  */

/** More an Interface than a abstract class defines it all necessary methods to
  * access the internet.
  * @class
  * @abstract
  * @param {external:String} [sopProxyPattern] A URL pattern used for access via a proxy.
  */
class WebAccessProvider {
  /**
    * @constructs
    * @param {external:String|null|undefined} sopProxyPattern A URL pattern used for access via a proxy.
    */
  constructor (sopProxyPattern) {
    this._sopProxyPattern = sopProxyPattern || null
  }

  /**
    * Set the "Same Origin Policy Proxy URL Pattern".
    * If the access to a URL fails and "sopProxyPattern" is set the Provider
    * start another try. For this second try a new URL is
    * generated from the pattern. In this new URL the placeholder $ulr$ is
    * replaced by the URL to call.
    * @param {external:String|null} pattern A URL pattern.
    */
  set sopProxyPattern (pattern) {
    this._sopProxyPattern = pattern || null
  }
  /** Get the "Same Origin Policy Proxy URL Pattern".
    * @returns {external:String|null} The "Same Origin Policy Proxy URL Pattern"
    */
  get sopProxyPattern () {
    return this._sopProxyPattern
  }

  /** Load a XML document from the internet.
    * @abstract
    * @param {external:String} url A URL to load a XML document from.
    * @returns {external:Promise} A promise that fullfiled with an XML document
    * or rejects if there is a network error or a HTTP status code other than 200.
    */
  downloadXML (url) {
    return Promise.reject(new Error('Not Implemented'))
  }

  /** Load a binary document from the internet.
    * @abstract
    * @param {external:String} url A URL to load a binary document from.
    * @returns {external:Promise} A promise that fullfiled with an ArrayBuffer
    * or rejects if there is a network error or a HTTP status code other than 200.
    */
  downloadArrayBuffer (url, onProgressCallback) {
    return Promise.reject(new Error('Not Implemented'))
  }
}
export default WebAccessProvider
