/** The HTML5Podcatcher Command Client tests.

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

/* global describe, it, expect, fail, beforeAll, afterAll */

import { CommandClient } from '../../../../sources/webapp/scripts/api/commands/client.js'

beforeAll(() => {
  window._Worker = window.Worker
  window.Worker = function (path, params) {
    this.terminate = function () {
      console.log('Simulate termination in proxy')
    }
    this.errorhandler = undefined
    this.messageerrorhandler = undefined
    this.messagehandler = undefined
    this.postMessage = function (message) {
      switch (message.command) {
        case 'messageerror':
          this.messagehandler('MESSAGE ERROR')
          break
        case 'error':
          this.errorhandler('ERROR')
          break
        default:
          this.messagehandler({
            data: {
              echo: {
                command: 'Test',
                payload: {}
              },
              type: 'result',
              payload: {}
            }
          })
          break
      }
    }
    this.addEventListener = function (event, callback, capture) {
      if (event === 'message') {
        this.messagehandler = callback
      } else if (event === 'messageerror') {
        this.messageerrorhandler = callback
      } else if (event === 'error') {
        this.errorhandler = callback
      }
    }
  }
})

describe('Package "Command Client "', () => {
  describe('Constructor "Command Client "', () => {
    it('throws an error if constructed without first parameter', () => {
      expect(() => new CommandClient()).toThrow()
    })

    it('throws an error if constructed with "undefined" as first parameter', () => {
      expect(() => new CommandClient(undefined)).toThrow()
    })

    it('throws an error if constructed with "null" as first parameter', () => {
      expect(() => new CommandClient(null)).toThrow()
    })

    it('throws an error if constructed with an empty string as first parameter', () => {
      expect(() => new CommandClient('')).toThrow()
    })

    it('should be if constructed with a file name', () => {
      const client = new CommandClient('test')
      expect(client).toBeDefined()
    })
  })

  describe('Method call of a command client ', () => {
    it('throws an error if called without first parameter', () => {
      const client = new CommandClient('test')
      expect(client.call).toThrow()
    })

    it('throws an error if called with "undefined" as first parameter', () => {
      const client = new CommandClient('test')
      expect(client.call, undefined, {}).toThrow()
    })

    it('throws an error if called with "null" as first parameter', () => {
      const client = new CommandClient('test')
      expect(client.call, null, {}).toThrow()
    })

    it('throws an error if called with an empty string as first parameter', () => {
      const client = new CommandClient('test')
      expect(client.call, '', {}).toThrow()
    })

    it('throws an error if called with a second parameter (payload) that is not an object or undefined', () => {
      const client = new CommandClient('test')
      expect(client.call, 'jump', null).toThrow()
      expect(client.call, 'run', 'hallo').toThrow()
      expect(client.call, 'marry me', 12).toThrow()
      expect(client.call, 'wash dishes', true).toThrow()
    })

    it('should return a promise when called', () => {
      const client = new CommandClient('test')
      const promise = client.call('test', {})
      expect(promise).toBeDefined()
      expect(promise instanceof Promise).toBeTrue()
    })

    it('should reject the promise when called against an non existing command processor', (done) => {
      const client = new CommandClient('nonExisting')
      client.call('error', {})
        .then((message) => {
          fail('It is expected to fail connecting the service worker')
          done()
        })
        .catch((error) => {
          expect(error).toBeDefined()
          done()
        })
    })

    it('should resolve the promise when received a "complete" message.', (done) => {
      const client = new CommandClient('existing')
      client.call('complete', {})
        .then((message) => {
          console.log(message)
          expect(true).toBeTrue()
          done()
        })
        .catch(() => {
          fail('It isn\'t expected to fail sending a command')
          done()
        })
    })
  })
})

afterAll(() => {
  window.Worker = window._Worker
  window._Worker = undefined
})
