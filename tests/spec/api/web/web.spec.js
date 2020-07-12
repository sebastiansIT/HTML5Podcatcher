/** The HTML5Podcatcher client for web access tests.

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

/* global jasmine, describe, it, expect, fail */

import XhrProviderClass from '../../../../sources/webapp/scripts/api/web/xhr.js'
import FetchProviderClass from '../../../../sources/webapp/scripts/api/web/fetch.js'

/**
 * Tests a given implementation of the abstract WebAccessProvider.
 * @private
 * @param {string} implName - Name of the implementation.
 * @param {module:podcatcher/web~WebAccessProvider} ProviderClass - An implementation of a WebAccessProvider.
 */
function testImplementation (implName, ProviderClass) {
  describe(`Implementation using "${implName}"`, () => {
    describe('Getting and setting proxy URL template', () => {
      it('should set the proxy template to null if constructor parameter is falsy', () => {
        const provider = new ProviderClass(undefined)
        expect(provider.sopProxyPattern === null)
      })

      it('should set the proxy template via constructor parameter', () => {
        const proxyUrl = 'proxy.endpoint/$url$/'
        const provider = new ProviderClass(proxyUrl)
        expect(provider.sopProxyPattern === proxyUrl)
      })

      it('should set the proxy template via setter', () => {
        const proxyUrl = 'proxy.endpoint/$url$/'
        const provider = new ProviderClass(proxyUrl)
        expect(provider.sopProxyPattern === null)
        provider.sopProxyPattern = proxyUrl
        expect(provider.sopProxyPattern === proxyUrl)
      })
    })

    // TODO test downloadXML()

    describe('Downloading an ArrayBuffer"', () => {
      const provider = new ProviderClass('base/tests/test.m4a')
      it('should throws an error if parameter "url" is undefinded', () => {
        expect(() => provider.downloadArrayBuffer(undefined)).toThrow()
      })

      it('should throws an error if parameter "url" is null', () => {
        expect(() => provider.downloadArrayBuffer(null)).toThrow()
      })

      it('should throws an error if parameter "url" is empty string', () => {
        expect(() => provider.downloadArrayBuffer('')).toThrow()
      })

      it('should throws an error if parameter "url" is whitespace string', () => {
        expect(() => provider.downloadArrayBuffer('\n')).toThrow()
      })

      it('should throws an error if parameter "url" isn\'t a string', () => {
        expect(() => provider.downloadArrayBuffer(3)).toThrow()
        expect(() => provider.downloadArrayBuffer({})).toThrow()
      })

      it('should throws an error if parameter "onProgressCallback" isn\'t a function', () => {
        expect(() => provider.downloadArrayBuffer('test.mp3', 'not a function')).toThrow()
        expect(() => provider.downloadArrayBuffer('test.mp3', 3)).toThrow()
        expect(() => provider.downloadArrayBuffer('test.mp3', {})).toThrow()
      })

      it('should return a promise when called', () => {
        const promise = provider.downloadArrayBuffer('http://localhost/test.mp3', (event) => { console.log(event) })
        expect(promise).toBeDefined()
        expect(promise instanceof Promise).toBeTrue()
      })

      it('should reject the promise if file is actively downloaded by a nother caller', (done) => {
        provider.downloadArrayBuffer('base/tests/test.m4a', (event) => { console.debug(event) })
        provider.downloadArrayBuffer('base/tests/test.m4a', (event) => { console.log(event) })
          .then((message) => {
            fail('It is expected to fail downloading a file twice a time.')
            done()
          })
          .catch((error) => {
            expect(error).toBeDefined()
            done()
          })
      })

      it('should reject the promise if file to download not exists', (done) => {
        const promise = provider.downloadArrayBuffer('nonExisting.m4a', (event) => { console.log(event) })
        expect(promise).toBeDefined()
        promise
          .then((message) => {
            fail('It is expected to fail downloading a file not existing.')
            done()
          })
          .catch((error) => {
            expect(error).toBeDefined()
            done()
          })
      })

      it('should fullfill the promise if file to download exists', (done) => {
        const promise = provider.downloadArrayBuffer('base/tests/test.m4a', (event) => { console.log(event) })
        expect(promise).toBeDefined()
        promise
          .then((message) => {
            done()
          })
          .catch(() => {
            fail('It isn\'t expected to fail downloading a file that exists.')
            done()
          })
      })

      it('should fullfill the promise with an ArrayBuffer', (done) => {
        const promise = provider.downloadArrayBuffer('base/tests/test.m4a', (event) => { console.log(event) })
        expect(promise).toBeDefined()
        promise
          .then((fileAsArrayBuffer) => {
            expect(fileAsArrayBuffer).toBeInstanceOf(ArrayBuffer)
            done()
          })
          .catch(() => {
            fail('It isn\'t expected to fail in this test.')
            done()
          })
      })

      it('should fullfill the promise even the URL isn\'t accessable directly (proxy communication)', (done) => {
        const promise = provider.downloadArrayBuffer('http://podcatcher.sebastiansit.de/onlyProxy.m4a', (event) => { console.log(event) })
        expect(promise).toBeDefined()
        promise
          .then((fileAsArrayBuffer) => {
            expect(fileAsArrayBuffer).toBeInstanceOf(ArrayBuffer)
            done()
          })
          .catch(() => {
            fail('It isn\'t expected to fail in this test.')
            done()
          })
      })

      it('should call the progress callback function at least on time.', (done) => {
        const callback = jasmine.createSpy('callback')
        const promise = provider.downloadArrayBuffer('http://podcatcher.sebastiansit.de/onlyProxy.m4a', callback)
        promise
          .then((fileAsArrayBuffer) => {
            expect(callback).toHaveBeenCalled()
            done()
          })
          .catch(() => {
            fail('It isn\'t expected to fail in this test.')
            done()
          })
      })
    })

    describe('Abort a web request', () => {
      it('should throws an error if parameter "url" is invalid', () => {
        const provider = new ProviderClass('base/tests/test.m4a')
        expect(() => provider.abort(undefined)).toThrow()
        expect(() => provider.abort(null)).toThrow()
        expect(() => provider.abort('')).toThrow()
        expect(() => provider.abort('\n\t')).toThrow()
      })

      it('should abort an ongoing request', (done) => {
        const provider = new ProviderClass()
        const url = 'base/tests/test.m4a'
        provider.downloadArrayBuffer(url/*, progressListener */)
          .then(() => {
            fail('Download should be aborted but is finished successfull.')
            done()
          })
          .catch((error) => {
            console.error(error)
            expect(error.name).toBe('AbortError')
            done()
          })
        provider.abort(url)
      })

      it('should abort an ongoing request if it\'s is handled via proxy', (done) => {
        const url = 'base/tests/test.m4a'
        const provider = new ProviderClass(url)
        provider.downloadArrayBuffer(url/*, progressListener */)
          .then(() => {
            fail('Download should be aborted but is finished successfull.')
            done()
          })
          .catch((error) => {
            expect(error.name).toBe('AbortError')
            done()
          })
        provider.abort(url)
      })
    })
  })
}

describe('Package "Web Access Client"', () => {
  testImplementation('XHR', XhrProviderClass)
  testImplementation('Fetch', FetchProviderClass)
})
