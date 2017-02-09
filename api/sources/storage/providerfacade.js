/** This module defines a facade class with functionality to manage different implementations of storage providers
    and access to this providers in a unique way.
    @module  html5podcatcher/storage/providerfacade
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @license Copyright 2016, 2017 Sebastian Spautz

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
    along with this program. If not, see http://www.gnu.org/licenses/.
*/

// ========================================= //
// ====== Class StorageProviderFacade ====== //
// ========================================= //
/** Facade for storage providers. The facade gives you a stable interface to the different implementations on different plattforms.
  * @class
  * @constructs module:html5podcatcher/model/providerfacade~StorageProviderFacade
  * @implements module:html5podcatcher/storage/DataStorageProvider~IDataStorageProvider
  * @implements module:html5podcatcher/storage/FileStorageProvider~IFileStorageProvider
  * @implements module:html5podcatcher/storage/SettingsStorageProvider~ISettingsStorageProvider
  */
var StorageProviderFacade = function () {
    /** Array of registered DataStorageProviders
      * @private
      * @type {Array.module:HTML5Podcatcher/Storage/DataStorageProvider~IDataStorageProvider}
      * @default []
      */
    var dataProviderList = [],

    /** Array of registered FileStorageProviders
      * @private
      * @type {Array.module:HTML5Podcatcher/Storage/FileStorageProvider~IFileStorageProvider}
      * @default []
      */
    fileProviderList = [],

    /** Array of registered SettingsStorageProviders
      * @private
      * @type {Array.module:HTML5Podcatcher/Storage/SettingsStorageProvider~ISettingsStorageProvider}
      * @default []
      */
    settingsProviderList = [];

    /* Allows you to register different implementiations of DataStorageProviders.
      * @public
      * @param {module:HTML5Podcatcher/Storage/DataStorageProvider~IDataStorageProvider} dataProvider A DataStorageProvider to register.
      */
    this.registerDataProvider = function (dataProvider) {
        dataProviderList.push(dataProvider);
    };

    /** Allows you to register different implementiations of FileStorageProviders.
      * @public
      * @param {module:HTML5Podcatcher/Storage/FileStorageProvider~IFileStorageProvider} fileProvider A FileStorageProvider to register.
      */
    this.registerFileProvider = function (fileProvider) {
        fileProviderList.push(fileProvider);
    };

    /** Allows you to register different implementiations of SettingsStorageProviders.
      * @public
      * @param {module:HTML5Podcatcher/Storage/SettingsStorageProvider~ISettingsStorageProvider} settingsProvider A SettingsStorageProvider to register.
      */
    this.registerSettingsProvider = function (settingsProvider) {
        settingsProviderList.push(settingsProvider);
    };

    /** The actual used DataStorageProvider.
      * @public
      * @type module:HTML5Podcatcher/Storage/DataStorageProvider~IDataStorageProvider
      */
    this.getDataStorageProvider = function () {
        var provider, priority = -1;

        dataProviderList.forEach(function (listedProvider) {
            if (listedProvider.isSupportedByCurrentPlatform && listedProvider.priority > priority) {
                provider = listedProvider;
                priority = provider.priority;
            }
        });
        if (!provider) {
            //TODO throw Exception();
        }

        return provider;
    };

    /** The actual used FileStorageProvider.
      * @member
      * @public
      * @type module:HTML5Podcatcher/Storage/FileStorageProvider~IFileStorageProvider
      */
    this.fileStorageProvider = function () {
        var provider, priority = -1;
        fileProviderList.forEach(function (listedProvider) {
            if (listedProvider.isSupportedByCurrentPlatform && listedProvider.priority > priority) {
                provider = listedProvider;
                priority = provider.priority;
            }
        });
        if (!provider) {
            //TODO HTML5Podcatcher.logger("Missing persistent file storage", 'error');
        }
        return provider;
    };

    /** The actual used SettingsStorageProvider.
      * @member
      * @public
      * @type module:HTML5Podcatcher/Storage/SettingsStorageProvider~ISettingsStorageProvider
      */
    this.settingsStorageProvider = function () {
        var provider, priority = -1;
        settingsProviderList.forEach(function (listedProvider) {
            if (listedProvider.isSupportedByCurrentPlatform && listedProvider.priority > priority) {
                provider = listedProvider;
                priority = provider.priority;
            }
        });
        if (!provider) {
            //TODO HTML5Podcatcher.logger("Missing persistent settings storage", 'error');
        }
        return provider;
    };
};

StorageProviderFacade.prototype.readEpisodesByStatus = function (listenState, onReadCallback) {
    var dataStorage = this.getDataStorageProvider();

    if (dataStorage) {
        this.getDataStorageProvider().readEpisodesByStatus(listenState, onReadCallback);
    } else {
        throw "No storage provider registered for Episodes";
    }
};

export default StorageProviderFacade;