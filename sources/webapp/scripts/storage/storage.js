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
/*jslint this: true */

var storageAPI = (function () {
    "use strict";
    var IDataProvider, IFileProvider, ISettingsProvider, StorageProviderFacade;

    /** This event is fired after each writing operation for one ore more episodes to the active storage provider.
     * @event EpisodesWriten
     * @property {object} detail - Detailed informations about the write operation.
     * @property {Episode[]} detail.episodes - The written episodes.
     */
    /** This event is fired after each writing operation for one ore more sources to the active storage provider.
     * @event SourcesWriten
     * @property {object} detail - Detailed informations about the write operation.
     * @property {Source[]} detail.sources - The written sources.
     */

    /** The `ReadedSourceCallback` is used by Data Storage Providers when a single reading operation on sources is finished.
      *
      * @callback ReadedSourceCallback
      * @param {Source} source - The source object readed from storage.
      */
    /** The `ReadedSourcesCallback` is used by Data Storage Providers when a group reading operation on sources is finished.
      *
      * @callback ReadedSourcesCallback
      * @param {Source[]} sources - The array of source objects readed from storage.
      */
    /** The `WritenSourceCallback` is used by Data Storage Providers when a writing operation on sources is finished.
      *
      * @callback WritenSourceCallback
      * @param {Source} source - The source object writen to storage.
      */
    /** The `WritenSourcesCallback` is used by Data Storage Providers when a group writing operation on sources is finished.
      *
      * @callback WritenSourcesCallback
      * @param {Source[]} sources - The array of source objects writen to storage.
      */
    /** The `DeletedSourceCallback` is used by Data Storage Providers when a deleting operation on sources is finished.
      *
      * @callback DeletedSourceCallback
      * @param {Source} sources - The sourc objects deleted from storage.
      */


    // ====================================== //
    // === Interface IDataProvider        === //
    // ====================================== //
    /** Interface defining methods to access a data storage for sources and episodes.
      * @interface
      */
    IDataProvider = function () {
        this.isSupportedByCurrentPlatform = false;
        this.priority = 0;
    };

    // -------------------------------------- //
    // --- Source storage                 --- //
    // -------------------------------------- //
    /** Read a source, identified by the given URI, from storage.
      * @param {string} sourceUri - The URI of the source-feed you want to read from storage.
      * @param {ReadedSourceCallback} [onReadCallback] - The function that is called when reading is finished.
      */
    IDataProvider.prototype.readSource = function (/*sourceUri, onReadCallback*/) {
        throw new Error('not implemented');
    };

    /** Reads all available sources from storage.
    * @param {ReadedSourcesCallback} [onReadCallback] - The function that is called when reading is finished.
    */
    IDataProvider.prototype.readSources = function (/*onReadCallback*/) {
        throw new Error('not implemented');
    };

    /** Write a source to the storage.
    * @param {Source} source - The source you want to write to the storage.
    * @param {WritenSourceCallback} [onWriteCallback] - The function that is called when writing is finished.
    */
    IDataProvider.prototype.writeSource = function (/*source, onWriteCallback*/) {
        throw new Error('not implemented');
    };

    /** Write an array of sources to the storage.
    * @param {Source[]} source - The sources you want to write to the storage.
    * @param {WritenSourcesCallback} [onWriteCallback] - The function that is called when writing is finished.
    */
    IDataProvider.prototype.writeSources = function (/*sources, onWriteCallback*/) {
        throw new Error('not implemented');
    };

    /** Delete a source from the storage.
    * @param {Source} source - The source you want to delete from the storage.
    * @param {DeletedSourceCallback} [onDeleteCallback] - The function that is called when deleting is finished.
    */
    IDataProvider.prototype.deleteSource = function (/*source, onDeleteCallback*/) {
        throw new Error('not implemented');
    };

    // -------------------------------------- //
    // --- Episode storage                --- //
    // -------------------------------------- //
    /** Read a episode from the storage.
    * @param {string} episodeUri - The URI of the episode you want to read from the storage.
    * @param {ReadedEpisodeCallback} [onReadCallback] - The function that is called when reading is finished.
    */
    IDataProvider.prototype.readEpisode = function (/*episodeUri, onReadCallback*/) {
        throw new Error('not implemented');
    };

    /** Read episodes from the storage. You can either read all episodes or only the new ones.
    * @param {boolean} showAll=false - If true you get all episodes. Otherwise you get only the new one.
    * @param {ReadedEpisodesCallback} [onReadCallback] - The function that is called when reading is finished.
    */
    IDataProvider.prototype.readPlaylist = function (/*showAll, onReadCallback*/) {
        throw new Error('not implemented');
    };

    /** Read episodes from the given podcast/source.
    * @param {Source} source - The source you want.
    * @param {ReadedEpisodesCallback} [onReadCallback] - The function that is called when reading is finished.
    */
    IDataProvider.prototype.readEpisodesBySource = function (/*source, onReadCallback*/) {
        throw new Error('not implemented');
    };

    /** Write a episodes to the storage.
    * @param {Episode} episode - The episode to write to the storage.
    * @param {WritenEpisodeCallback} [onWriteCallback] - The function that is called when writing is finished.
    */
    IDataProvider.prototype.writeEpisode = function (/*episode, onWriteCallback*/) {
        throw new Error('not implemented');
    };

    /** Write an array of episodes to the storage.
    * @param {Episode[]} episodes - The episodes to write to the storage.
    * @param {WritenEpisodesCallback} [onWriteCallback] - The function that is called when writing is finished.
    */
    IDataProvider.prototype.writeEpisodes = function (/*episodes, onWriteCallback*/) {
        throw new Error('not implemented');
    };

    // -------------------------------------- //
    // ---  General storage functions     --- //
    // -------------------------------------- //
    /** Delete all content from the data storage.
     * @param {CleandStorageCallback} onCleanupCallback - The function that is called when all data from data storage is deletet.
     */
    IDataProvider.prototype.cleanStorage = function (/*onCleanupCallback*/) {
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
    IFileProvider.prototype.openFile = function (/*episode, onReadCallback*/) {
        throw new Error('not implemented');
    };
    IFileProvider.prototype.saveFile = function (/*episode, content, mimeType, onWriteCallback, onProgressCallback*/) {
        throw new Error('not implemented');
    };

    /** Delete all media files associated with the given episode from the storage.
     * @param {Episode} episode - The episode whose files should deleted from the storage.
     * @param {DeletedFileCallback} [onDeleteCallback] - The function that is called when deleting is finished.
     */
    IFileProvider.prototype.deleteFile = function (/*episode, onDeleteCallback*/) {
        throw new Error('not implemented');
    };

    IFileProvider.prototype.listFiles = function (/*onReadCallback*/) {
        throw new Error('not implemented');
    };
    // === General storage functions
    IFileProvider.prototype.init = function (parameters) {
        HTML5Podcatcher.logger('Init abstract file storage provider with' + parameters, 'debug');
    };

    /** Delete all content from the file storage.
     * @param {CleandStorageCallback} onCleanupCallback - The function that is called when all data from file storage is deletet.
     */
    IFileProvider.prototype.cleanStorage = function (/*onCleanupCallback*/) {
        throw new Error('not implemented');
    };


    // ====================================== //
    // === Interface ISettingsProvider    === //
    // ====================================== //
    /** Interface defining methods to access a storage for settings.
      * @interface
      */
    ISettingsProvider = function () {
        this.isSupportedByCurrentPlatform = false;
        this.priority = 0;
    };

    /** Get the value for the given user setting.
      * @param {string} key - The key of the application setting you want to get.
      */
    ISettingsProvider.prototype.readSettingsValue = function (/*key*/) {
        throw new Error('not implemented');
    };
    /** Set a value for the given key of a user setting.
      * @param {string} key - The key of the application setting you want to set.
      * @param {(string|number)}  - The value for the application setting you want to set.
      */
    ISettingsProvider.prototype.writeSettingsValue = function (/*key, value*/) {
        throw new Error('not implemented');
    };
    ISettingsProvider.prototype.listSettings = function () {
        throw new Error('not implemented');
    };
    ISettingsProvider.prototype.cleanStorage = function () {
        throw new Error('not implemented');
    };

    // ====================================== //
    // === Singelton StorageProviderFacade=== //
    // ====================================== //
    /** Singelton facade for storage providers. The facade gives you a stable interface to the different implementations on different plattforms.
      * It is exported as the global member "document.HTML5Podcatcher.api.storageStorageProvider".
      * @class
      */
    StorageProviderFacade = function () {
        var dataProviderList = [], fileProviderList = [], settingsProviderList = [];
        this.registerDataProvider = function (dataProvider) {
            dataProviderList.push(dataProvider);
        };
        this.registerFileProvider = function (fileProvider) {
            fileProviderList.push(fileProvider);
        };
        this.registerSettingsProvider = function (settingsProvider) {
            settingsProviderList.push(settingsProvider);
        };
        this.dataStorageProvider = function () {
            var provider, priority = -1;
            dataProviderList.forEach(function (listedProvider) {
                if (listedProvider.isSupportedByCurrentPlatform && listedProvider.priority > priority) {
                    provider = listedProvider;
                    priority = provider.priority;
                }
            });
            if (!provider) {
                HTML5Podcatcher.logger('Missing persistent data storage', 'error');
            }
            return provider;
        };
        this.fileStorageProvider = function () {
            var provider, priority = -1;
            fileProviderList.forEach(function (listedProvider) {
                if (listedProvider.isSupportedByCurrentPlatform && listedProvider.priority > priority) {
                    provider = listedProvider;
                    priority = provider.priority;
                }
            });
            if (!provider) {
                HTML5Podcatcher.logger("Missing persistent file storage", 'error');
            }
            return provider;
        };
        this.settingsStorageProvider = function () {
            var provider, priority = -1;
            settingsProviderList.forEach(function (listedProvider) {
                if (listedProvider.isSupportedByCurrentPlatform && listedProvider.priority > priority) {
                    provider = listedProvider;
                    priority = provider.priority;
                }
            });
            if (!provider) {
                HTML5Podcatcher.logger("Missing persistent settings storage", 'error');
            }
            return provider;
        };
    };

    // == Generall functions of a storage provider
    /** Cleanup of all saved sources, episodes and files.
      * {DeletedStorageCallback} [onDeleteCallback] - The function that is called when cleanup is finished.
      */
    StorageProviderFacade.prototype.cleanStorage = function (onDeleteCallback) {
        var dataProvider = this.dataStorageProvider(),
            fileProvider = this.fileStorageProvider(),
            settingsProvider = this.settingsStorageProvider();
        settingsProvider.cleanStorage();
        if (dataProvider && fileProvider) {
            HTML5Podcatcher.logger("clean dataStorage befor file storage", 'debug');
            dataProvider.cleanStorage(function () {
                HTML5Podcatcher.logger("clean fileStorage after data storage", 'debug');
                fileProvider.cleanStorage(onDeleteCallback);
            });
        } else if (dataProvider) {
            HTML5Podcatcher.logger('clean data storage', 'debug');
            dataProvider.cleanStorage(onDeleteCallback);
        } else if (fileProvider) {
            HTML5Podcatcher.logger('clean file storage', 'debug');
            fileProvider.cleanStorage(onDeleteCallback);
        }
    };
    StorageProviderFacade.prototype.init = function (parameters) {
        if (this.fileStorageProvider()) {
            this.fileStorageProvider().init(parameters);
        }
    };
    /** Migration between storage engines
      */
    StorageProviderFacade.prototype.migradeData = function (oldStorageEngine, newStorageEngine) {
        oldStorageEngine.readSources(function (sourcesList) {
            sourcesList.forEach(function (source) {
                newStorageEngine.writeSource(source, HTML5Podcatcher.web.downloadSource);
                oldStorageEngine.deleteSource(source);
            });
        });
        newStorageEngine.readPlaylist(false, function (episodeList) {
            episodeList.forEach(function (episode) {
                episode.playback.played = true;
                newStorageEngine.writeEpisode(episode);
            });
        });
        oldStorageEngine.readPlaylist(false, function (episodeList) {
            episodeList.forEach(function (episode) {
                newStorageEngine.writeEpisode(episode);
            });
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

    /** Saves a single source with the active storage provider.
      * @param {Source} source - a source object.
      * @param {WritenSourcCallback} [onWriteCallback] - The function that is called when writing is finished.
      * @fires SourcesWriten
      */
    StorageProviderFacade.prototype.writeSource = function (source, onWriteCallback) {
        this.dataStorageProvider().writeSource(source, function (source) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback(source);
            }
            document.dispatchEvent(new CustomEvent('writeSource', {"detail": {'source': source}}));
        });
    };

    /** Saves a set of sources with the active storage provider.
      * @param {Source[]} sources - a array with source objects.
      * @param {WritenSourcesCallback} [onWriteCallback] - The function that is called when writing is finished.
      * @fires SourcesWriten
      */
    StorageProviderFacade.prototype.writeSources = function (sources, onWriteCallback) {
        //Test parameter sources
        if (!(sources instanceof Array) || sources.length <= 0) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback(sources);
            }
            return;
        }

        //call active storage provider
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

    /** Saves a single episode with the active storage provider.
      * @param {Episode} episode - an episode object.
      * @param {WritenEpisodesCallback} [onWriteCallback] - The function that is called when writing is finished.
      * @fires EpisodesWriten
      */
    StorageProviderFacade.prototype.writeEpisode = function (episode, onWriteCallback) {
        this.dataStorageProvider().writeEpisode(episode, function (episode) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback(episode);
            }
            document.dispatchEvent(new CustomEvent('writeEpisode', {"detail": {'episode': episode}}));
        });
    };

    /** Saves a set of episodes with the active storage provider.
      * @param {Episode[]} episodes - a array with source objects
      * @param {WritenEpisodesCallback} [onWriteCallback] - The function that is called when writing is finished.
      * @fires EpisodesWriten
      */
    StorageProviderFacade.prototype.writeEpisodes = function (episodes, onWriteCallback) {
        //Test if the are any episodes to write
        if (!(episodes instanceof Array) || episodes.length <= 0) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback(episodes);
            }
            return;
        }

        //call active storage provider
        this.dataStorageProvider().writeEpisodes(episodes, function (episodes) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback(episodes);
            }
            document.dispatchEvent(new CustomEvent('writeEpisodes', {'detail': {'episodes': episodes}}));
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

    // == Access on storage for Settings
    StorageProviderFacade.prototype.writeSettingsValue = function (key, value) {
        this.settingsStorageProvider().writeSettingsValue(key, value);
    };
    StorageProviderFacade.prototype.readSettingsValue = function (key) {
        return this.settingsStorageProvider().readSettingsValue(key);
    };
    StorageProviderFacade.prototype.listSettings = function () {
        return this.settingsStorageProvider().listSettings();
    };

    // ====================================== //
    // === Export public Elements         === //
    // ====================================== //
    return {
        'IDataProvider': IDataProvider,
        'IFileProvider': IFileProvider,
        'ISettingsProvider': ISettingsProvider,
        'StorageProvider': new StorageProviderFacade()
    };
}());

/** The modul "Storage" is available at document.HTML5Podcatcher.api.storage.
  * @global
  * @name "HTML5Podcatcher.api.storage"
  * @see module:HTML5Podcatcher/Storage
  */
HTML5Podcatcher.api.storage = storageAPI;