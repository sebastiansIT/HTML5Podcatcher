/** @module  HTML5Podcatcher/Storage
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @license Copyright 2015 Sebastian Spautz

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

/*global document, CustomEvent */
/*global HTML5Podcatcher */

/** @namespace */
HTML5Podcatcher.api.storage = (function () {
    "use strict";
    var IDataProvider, IFileProvider, StorageProviderFacade;
    /** The `ReadSourceCallback` is used by Data Storage Providers when a single reading operation on sources is finished.
     *
     * @callback ReadSourceCallback
     * @param {Source} source - The source object readed from storage.
     */
    /** The `ReadSourcesCallback` is used by Data Storage Providers when a group reading operation on sources is finished.
     *
     * @callback ReadSourcesCallback
     * @param {Source[]} sources - The array of source objects readed from storage.
     */
    /** The `WriteSourceCallback` is used by Data Storage Providers when a writing operation on sources is finished.
     *
     * @callback WriteSourceCallback
     * @param {Source} source - The source object writen to storage.
     */
    /** The `WriteSourcesCallback` is used by Data Storage Providers when a group writing operation on sources is finished.
     *
     * @callback WriteSourcesCallback
     * @param {Source[]} sources - The array of source objects writen to storage.
     */
    /** The `DeleteSourceCallback` is used by Data Storage Providers when a deleting operation on sources is finished.
     *
     * @callback DeleteSourceCallback
     * @param {Source} sources - The sourc objects deleted from storage.
     */
    /** Interface defining methods to access a data storage for sources and episodes.
      * @interface
      */
    IDataProvider = function () {
        this.isSupportedByCurrentPlatform = false;
        this.priority = 0;
    };
    //Source Storage
    /** Read a source, identified by the given URI, from storage.
      * @param {string} sourceUri - The URI of the source-feed you want to read from storage.
      * @param {ReadSourceCallback} [onReadCallback] - The function that is called when reading is finished.
      */
    IDataProvider.prototype.readSource = function (sourceUri, onReadCallback) {
        throw new Error('not implemented');
    };
    /** Reads all available sources from storage.
      * @param {ReadSourcesCallback} [onReadCallback] - The function that is called when reading is finished.
      */
    IDataProvider.prototype.readSources = function (onReadCallback) {
        throw new Error('not implemented');
    };
    /** Write a source to the storage.
      * @param {Source} source - The source you want to write to the storage.
      * @param {WriteSourceCallback} [onWriteCallback] - The function that is called when writing is finished.
      */
    IDataProvider.prototype.writeSource = function (source, onWriteCallback) {
        throw new Error('not implemented');
    };
    /** Write an array of sources to the storage.
      * @param {Source[]} source - The source you want to write to the storage.
      * @param {WriteSourcesCallback} [onWriteCallback] - The function that is called when writing is finished.
      */
    IDataProvider.prototype.writeSources = function (sources, onWriteCallback) {
        throw new Error('not implemented');
    };
    /** Delete a source from the storage.
      * @param {Source} source - The source you want to delete from the storage.
      * @param {DeleteSourcesCallback} [onDeleteCallback] - The function that is called when writing is finished.
      */
    IDataProvider.prototype.deleteSource = function (source, onDeleteCallback) {
        throw new Error('not implemented');
    };
    // Episode Storage
    IDataProvider.prototype.readEpisode = function (episodeUri, onReadCallback) {
        throw new Error('not implemented');
    };
    IDataProvider.prototype.readPlaylist = function (showAll, onReadCallback) {
        throw new Error('not implemented');
    };
    IDataProvider.prototype.readEpisodesBySource = function (source, onReadCallback) {
        throw new Error('not implemented');
    };
    IDataProvider.prototype.writeEpisode = function (episode, onWriteCallback) {
        throw new Error('not implemented');
    };
    IDataProvider.prototype.writeEpisodes = function (episodes, onWriteCallback) {
        throw new Error('not implemented');
    };
    // General storage functions
    IDataProvider.prototype.cleanStorage = function (onDeleteCallback) {
        throw new Error('not implemented');
    };
    // ====================================== //
    // === Interface IFileprovider        === //
    // ====================================== //
    /** Interface defining methods to access a storage for files (BLOBs).
      * @interface
      */
    IFileProvider = function () {
        this.isSupportedByCurrentPlatform = false;
        this.priority = 0;
    };
    IFileProvider.prototype.openFile = function (episode, onReadCallback) {
        throw new Error('not implemented');
    };
    IFileProvider.prototype.saveFile = function (episode, content, mimeType, onWriteCallback, onProgressCallback) {
        throw new Error('not implemented');
    };
    IFileProvider.prototype.deleteFile = function (episode, onDeleteCallback) {
        throw new Error('not implemented');
    };
    IFileProvider.prototype.listFiles = function (onReadCallback) {
        throw new Error('not implemented');
    };
    // === General storage functions
    IFileProvider.prototype.init = function (parameters) {
        HTML5Podcatcher.logger('Init abstract file storage provider with' + parameters, 'debug');
    };
    IFileProvider.prototype.cleanStorage = function (onDeleteCallback) {
        throw new Error('not implemented');
    };
    // ====================================== //
    // === Singelton StorageProviderFacade=== //
    // ====================================== //
    /** Singelton facade for storage providers. The facade gives you a stable interface to the different implementations on different plattforms.
      * @class
      */
    StorageProviderFacade = function () {
        var dataProviderList = [], fileProviderList = [];
        this.registerDataProvider = function (dataProvider) {
            dataProviderList.push(dataProvider);
        };
        this.registerFileProvider = function (fileProvider) {
            fileProviderList.push(fileProvider);
        };
        this.dataStorageProvider = function () {
            var i = 0, provider, priority = -1;
            for (i = 0; i < dataProviderList.length; i++) {
                if (dataProviderList[i].isSupportedByCurrentPlatform && dataProviderList[i].priority > priority) {
                    provider = dataProviderList[i];
                    priority = provider.priority;
                }
            }
            if (!provider) {
                HTML5Podcatcher.logger("Missing persistent data storage", "error");
            }
            return provider;
        };
        this.fileStorageProvider = function () {
            var i = 0, provider, priority = -1;
            for (i = 0; i < fileProviderList.length; i++) {
                if (fileProviderList[i].isSupportedByCurrentPlatform && fileProviderList[i].priority > priority) {
                    provider = fileProviderList[i];
                    priority = provider.priority;
                }
            }
            if (!provider) {
                HTML5Podcatcher.logger("Missing persistent file storage", "error");
            }
            return provider;
        };
    };
    // == Generall functions of a storage provider
    StorageProviderFacade.prototype.cleanStorage = function (onDeleteCallback) {
        if (this.dataStorageProvider()) {
            this.dataStorageProvider().cleanStorage(onDeleteCallback);
        }
        if (this.fileStorageProvider()) {
            this.dataStorageProvider().cleanStorage(onDeleteCallback);
        }
    };
    StorageProviderFacade.prototype.init = function (parameters) {
        this.fileStorageProvider(parameters);
    };
    /** Migration between storage engines
    */
    StorageProviderFacade.prototype.migradeData = function (oldStorageEngine, newStorageEngine) {
        oldStorageEngine.readSources(function (sourcesList) {
            var i;
            for (i = 0; i < sourcesList.length; i++) {
                newStorageEngine.writeSource(sourcesList[i], HTML5Podcatcher.web.downloadSource);
                oldStorageEngine.deleteSource(sourcesList[i]);
            }
        });
        newStorageEngine.readPlaylist(false, function (episodeList) {
            var i;
            for (i = 0; i < episodeList.length; i++) {
                episodeList[i].playback.played = true;
                newStorageEngine.writeEpisode(episodeList[i]);
            }
        });
        oldStorageEngine.readPlaylist(false, function (episodeList) {
            var i;
            for (i = 0; i < episodeList.length; i++) {
                newStorageEngine.writeEpisode(episodeList[i]);
            }
        });
    };
    StorageProviderFacade.prototype.isFileStorageAvailable = function () {
        var returnvalue = false;
        if (this.fileStorageProvider()) {
            returnvalue = true;
        }
        return returnvalue;
    };
    // == Access on storage for sources
    StorageProviderFacade.prototype.readSource = function (sourceUri, onReadCallback) {
        this.dataStorageProvider().readSource(sourceUri, onReadCallback);
    };
    StorageProviderFacade.prototype.readSources = function (onReadCallback) {
        this.dataStorageProvider().readSources(onReadCallback);
    };
    StorageProviderFacade.prototype.writeSource = function (source, onWriteCallback) {
        this.dataStorageProvider().writeSource(source, function (source) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback(source);
            }
            document.dispatchEvent(new CustomEvent('writeSource', {"detail": {'source': source}}));
        });
    };
    StorageProviderFacade.prototype.writeSources = function (sources, onWriteCallback) {
        this.dataStorageProvider().writeSources(sources, function (sources) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback(sources);
            }
            document.dispatchEvent(new CustomEvent('writeSources', {"detail": {'sources': sources}}));
        });
    };
    StorageProviderFacade.prototype.deleteSource = function (source, onDeleteCallback) {
        this.dataStorageProvider().deleteSource(source, onDeleteCallback);
    };
    // == Access on storage for episodes
    StorageProviderFacade.prototype.readEpisode = function (episodeUri, onReadCallback) {
        this.dataStorageProvider().readEpisode(episodeUri, onReadCallback);
    };
    StorageProviderFacade.prototype.readPlaylist = function (showAll, onReadCallback) {
        this.dataStorageProvider().readPlaylist(showAll, onReadCallback);
    };
    StorageProviderFacade.prototype.readEpisodesBySource = function (source, onReadCallback) {
        this.dataStorageProvider().readEpisodesBySource(source, onReadCallback);
    };
    StorageProviderFacade.prototype.writeEpisode = function (episode, onWriteCallback) {
        this.dataStorageProvider().writeEpisode(episode, function (episode) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback(episode);
            }
            document.dispatchEvent(new CustomEvent('writeEpisode', {"detail": {'episode': episode}}));
        });
    };
    StorageProviderFacade.prototype.writeEpisodes = function (episodes, onWriteCallback) {
        this.dataStorageProvider().writeEpisodes(episodes, function (episodes) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback(episodes);
            }
            document.dispatchEvent(new CustomEvent('writeEpisodes', {"detail": {'episodes': episodes}}));
        });
    };
    // == Access on storage for BLOBs
    StorageProviderFacade.prototype.openFile = function (episode, onReadCallback) {
        if (episode.isFileSavedOffline) {
            if (this.fileStorageProvider()) {
                this.fileStorageProvider().openFile(episode, onReadCallback);
            }
        } else {
            if (onReadCallback && typeof onReadCallback === 'function') {
                onReadCallback(episode);
            }
        }
    };
    StorageProviderFacade.prototype.saveFile = function (episode, content, mimeType, onWriteCallback, onProgressCallback) {
        this.fileStorageProvider().saveFile(episode, content, mimeType, onWriteCallback, onProgressCallback);
    };
    StorageProviderFacade.prototype.deleteFile = function (episode, onDeleteCallback) {
        this.fileStorageProvider().deleteFile(episode, onDeleteCallback);
    };
    StorageProviderFacade.prototype.listFiles = function (onReadCallback) {
        this.fileStorageProvider().listFiles(onReadCallback);
    };
    // ====================================== //
    // === Export public Elements         === //
    // ====================================== //
    return {
        'IDataProvider': IDataProvider,
        'IFileProvider': IFileProvider,
        'StorageProvider': new StorageProviderFacade()
    };
}());