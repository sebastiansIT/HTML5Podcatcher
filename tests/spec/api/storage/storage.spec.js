/** Tests for the storage module.

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

/* global describe, it, expect, spyOnProperty */

import { StorageServiceProvider as Provider, StorageService as Service } from '../../../../sources/webapp/scripts/api/storage/storage.js'

describe('Package "Storage"', () => {
  describe('Class StorageService', () => {
    it('should be usable per default', () => {
      const service = new Service()
      expect(service.usable).toBeTrue()
    })
  })

  describe('Class StorageProvider', () => {
    it('should register a StorageService', () => {
      const provider = new Provider()
      const service = new Service()
      spyOnProperty(service, 'compatible', 'get').and.returnValue(true)
      provider.register(service, 100)
      expect(provider.provide()).toBeDefined()
    })

    it('should throw an error registering somthing other than a StorageService', () => {
      const provider = new Provider()
      expect(() => provider.register(undefined, 100)).toThrow()
      expect(() => provider.register(null, 100)).toThrow()
      expect(() => provider.register(200, 100)).toThrow()
      expect(() => provider.register('no service', 100)).toThrow()
      expect(() => provider.register(false, 100)).toThrow()
      expect(() => provider.register({}, 100)).toThrow()
    })

    it('should throw an error registering a service with a priority thats not a number', () => {
      const provider = new Provider()
      const service = new Service()
      spyOnProperty(service, 'compatible', 'get').and.returnValue(true)
      expect(() => provider.register(service, undefined)).toThrow()
      expect(() => provider.register(service, null)).toThrow()
      expect(() => provider.register(service, 'no service')).toThrow()
      expect(() => provider.register(service, false)).toThrow()
      expect(() => provider.register(service, {})).toThrow()
    })

    it('should throw an error when an service is requested but non is registered', () => {
      const provider = new Provider()
      expect(() => provider.provide()).toThrow()
    })

    it('should not register a StorageService that is not compatible', () => {
      const provider = new Provider()
      const service = new Service()
      spyOnProperty(service, 'compatible', 'get').and.returnValue(false)
      provider.register(service, 100)
      expect(() => provider.provide()).toThrow()
    })

    it('should provide the usable service with the highest priority', () => {
      const provider = new Provider()
      const service1 = new Service()
      spyOnProperty(service1, 'compatible', 'get').and.returnValue(true)
      provider.register(service1, 100)
      const service2 = new Service()
      spyOnProperty(service2, 'compatible', 'get').and.returnValue(true)
      provider.register(service2, 300)
      const service3 = new Service()
      spyOnProperty(service3, 'compatible', 'get').and.returnValue(true)
      provider.register(service3, 200)
      const service4 = new Service()
      spyOnProperty(service4, 'compatible', 'get').and.returnValue(true)
      spyOnProperty(service4, 'usable', 'get').and.returnValue(false)
      provider.register(service4, 400)

      expect(service2 === provider.provide()).toBeTrue()
    })
  })
})
