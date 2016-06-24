/** @module  HTML5Podcatcher/Storage/IndexedDatabase
     @author  SebastiansIT [sebastian@human-injection.de]
     @license Copyright 2013-2015 Sebastian Spautz

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

/*global window, Blob, ArrayBuffer */
/*global IDBKeyRange */
/*global HTML5Podcatcher */

var indexedDbStorageImplementation = (function () {
    "use strict";
    var settings, updateIndexedDB, cleanStorage, IndexedDbDataProvider, IndexedDbFileProvider;
    // === Private Felder
    settings = {
        name: 'HTML5Podcatcher',
        version: 7,
        sourcesStore: 'sources',
        episodesStore: 'episodes',
        filesStore: 'files',
        chunkSize: 1024 * 1024 //1 MByte
    };
    updateIndexedDB = function (event) {
        HTML5Podcatcher.logger("Database Update from Version " + event.oldVersion + " to Version " + event.newVersion, 'info');
        var db, episodeStore;
        db = this.result;
        //Add object store for sources/feeds
        if (!db.objectStoreNames.contains(settings.sourcesStore)) {
            db.createObjectStore(settings.sourcesStore, { keyPath: 'uri' });
        }
        //Add object store for episodes
        if (!db.objectStoreNames.contains(settings.episodesStore)) {
            episodeStore = db.createObjectStore(settings.episodesStore, { keyPath: 'uri' });
            episodeStore.createIndex('source', 'source', {unique: false});
        }
        //Add index "status" to episode store
        episodeStore = event.currentTarget.transaction.objectStore(settings.episodesStore);
        if (!episodeStore.indexNames.contains("status")) {
            episodeStore.createIndex("status", "playback.played", { unique: false });
        }
        //Add index "source" to episode store
        episodeStore = event.currentTarget.transaction.objectStore(settings.episodesStore);
        if (!episodeStore.indexNames.contains("sources")) {
            episodeStore.createIndex("sources", "source", { unique: false });
        }
        //Add object store for Files
        if (!db.objectStoreNames.contains(settings.filesStore)) {
            db.createObjectStore(settings.filesStore, {});
        }
    };
    cleanStorage = function (onDeleteCallback) {
        var requestDeleteDB = window.indexedDB.deleteDatabase(this.getDatabaseName());
        requestDeleteDB.onsuccess = function () {
            HTML5Podcatcher.logger("Indexed database deleted", 'info');

            if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                onDeleteCallback();
            }
        };
        requestDeleteDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " deleting IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };

    // ====================================== //
    // === Implementation of DataProvider === //
    // ====================================== //
    /** Provides access to a data storage implemented with Indexed Database API.
    * @class
    * @implements module:HTML5Podcatcher/Storage~IDataProvider
    * @param {string} [databaseName=HTML5Podcatcher] - The name of the database.
    * @param {number} [databaseVersion=7] - The version of the used database schema.
    * @param {string} [storeNameSources=sources] - The name of the store with source Objects.
    * @param {string} [storeNameEpisodes=episodes] - The name of the store with episode Objects.
    */
    IndexedDbDataProvider = function (databaseName, databaseVersion) {
        var dbName = databaseName || settings.name,
            dbVersion = databaseVersion || settings.version,
            dbStoreSources = settings.sourcesStore,
            dbStoreEpisodes = settings.episodesStore;
        this.getDatabaseName = function () { return dbName; };
        this.getDatabaseVersion = function () { return dbVersion; };
        this.getStoreNameSources = function () { return dbStoreSources; };
        this.getStoreNameEpisodes = function () { return dbStoreEpisodes; };
        this.isSupportedByCurrentPlatform = indexedDB;
        this.priority = 100;
    };
    IndexedDbDataProvider.prototype = new HTML5Podcatcher.api.storage.IDataProvider();
    IndexedDbDataProvider.prototype.constructor = IndexedDbDataProvider;
    IndexedDbDataProvider.prototype.toString = function () {
        return "Data storage provider based on Indexed Database API [Database: " + this.getDatabaseName() + " | Version: " + this.getDatabaseVersion() + "]";
    };
    IndexedDbDataProvider.prototype.updateIndexedDB = updateIndexedDB;
    IndexedDbDataProvider.prototype.cleanStorage = cleanStorage;
    // == Access on storage for sources
    IndexedDbDataProvider.prototype.readSource = function (sourceUri, onReadCallback) {
        var requestOpenDB, provider = this;
        requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug:IndexedDatabaseAPI');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, request;
            db = this.result;
            transaction = db.transaction([provider.getStoreNameSources()], 'readonly');
            store = transaction.objectStore(provider.getStoreNameSources());
            request = store.get(sourceUri);
            request.onsuccess = function (event) {
                var source;
                if (event.target.result) {
                    HTML5Podcatcher.logger('Source ' + event.target.result.uri + ' readed from database', 'debug:IndexedDatabaseAPI');
                    source = event.target.result;
                } else {
                    source = { 'uri': sourceUri };
                }

                if (onReadCallback && typeof onReadCallback === 'function') {
                    onReadCallback(source);
                }
            };
            request.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while reading source "' + sourceUri + '" from IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        requestOpenDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };
    IndexedDbDataProvider.prototype.readSources = function (onReadCallback) {
        var request, provider = this;
        request = indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
        request.onupgradeneeded = provider.updateIndexedDB;
        request.onblocked = function () { HTML5Podcatcher.logger("Database blocked", 'debug:IndexedDatabaseAPI'); };
        request.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, cursorRequest, sourcelist;
            db = this.result;
            transaction = db.transaction([provider.getStoreNameSources()], 'readonly');
            store = transaction.objectStore(provider.getStoreNameSources());
            cursorRequest = store.openCursor();
            sourcelist = [];
            cursorRequest.onsuccess = function (event) {
                var result = event.target.result;
                if (result) {
                    sourcelist.push(result.value);
                    result.continue();
                } else {
                    if (onReadCallback && typeof onReadCallback === 'function') {
                        onReadCallback(sourcelist);
                    }
                }
            };
            request.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while reading list of sources from IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        request.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };
    IndexedDbDataProvider.prototype.writeSource = function (source, onWriteCallback) {
        var requestOpenDB, provider = this;
        requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked while saving source", 'debug:IndexedDatabaseAPI');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, request;
            db = this.result;
            transaction = db.transaction([provider.getStoreNameSources()], 'readwrite');
            store = transaction.objectStore(provider.getStoreNameSources());
            request = store.put(source);
            // Erfolgs-Event
            request.onsuccess = function (event) {
                HTML5Podcatcher.logger('Source ' + event.target.result + ' saved', 'info');
                if (onWriteCallback && typeof onWriteCallback === 'function') {
                    onWriteCallback(source);
                }
            };
            request.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while saving source "' + source.uri + '" to IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        requestOpenDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };
    IndexedDbDataProvider.prototype.writeSources = function (sources, onWriteCallback) {
        var requestOpenDB, provider = this;
        //check parameter "sources"
        if (sources === 'undefined' || sources.length === 0) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback([]);
            }
            return;
        }
        requestOpenDB = window.indexedDB.open(this.getDatabaseName(), this.getDatabaseVersion());
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked while writing source", 'debug:IndexedDatabaseAPI');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, request, i, saveFunction;
            db = this.result;
            i = 0;
            transaction = db.transaction([provider.getStoreNameSources()], 'readwrite');
            store = transaction.objectStore(provider.getStoreNameSources());
            saveFunction = function () {
                request = store.put(sources[i]);
                request.onsuccess = function (event) {
                    HTML5Podcatcher.logger('Source ' + event.target.result + ' saved', 'info');
                    i++;
                    if (i < sources.length) {
                        saveFunction();
                    } else if (onWriteCallback && typeof onWriteCallback === 'function') {
                        onWriteCallback(sources);
                    }
                };
                request.onerror = function (event) {
                    HTML5Podcatcher.logger(event.target.error.name + ' while saving source "' + sources[i].uri + '" to IndexedDB (' + event.target.error.message + ')', 'error');
                    sources.splice(i, 1);
                    if (i < sources.length) {
                        saveFunction();
                    } else if (onWriteCallback && typeof onWriteCallback === 'function') {
                        onWriteCallback(sources);
                    }
                };
            };
            saveFunction();
        };
        requestOpenDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };
    IndexedDbDataProvider.prototype.deleteSource = function (source, onDeleteCallback) {
        var requestOpenDB, provider = this;
        requestOpenDB = window.indexedDB.open(this.getDatabaseName(), this.getDatabaseVersion());
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked while deleting source", 'debug:IndexedDatabaseAPI');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, request;
            db = this.result;
            transaction = db.transaction([provider.getStoreNameSources()], 'readwrite');
            store = transaction.objectStore(provider.getStoreNameSources());
            request = store.delete(source.uri);
            request.onsuccess = function () {
                HTML5Podcatcher.logger('Source ' + source.uri + ' deleted from database', 'debug:IndexedDatabaseAPI');
                if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                    onDeleteCallback(source);
                }
            };
            request.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while deleting source "' + source.uri + '" from IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        requestOpenDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };
    // == Access on storage for episodes
    IndexedDbDataProvider.prototype.readEpisode = function (episodeUri, onReadCallback) {
        var requestOpenDB, provider = this;
        if (episodeUri) {
            requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
            requestOpenDB.onupgradeneeded = this.updateIndexedDB;
            requestOpenDB.onblocked = function () {
                HTML5Podcatcher.logger("Database blocked while reading episode", 'debug:IndexedDatabaseAPI');
            };
            requestOpenDB.onsuccess = function () {
                HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
                var db, transaction, store, request;
                db = this.result;
                transaction = db.transaction([provider.getStoreNameEpisodes()], 'readonly');
                store = transaction.objectStore(provider.getStoreNameEpisodes());
                request = store.get(episodeUri);
                // Erfolgs-Event
                request.onsuccess = function (event) {
                    var episode;
                    if (event.target.result) {
                        HTML5Podcatcher.logger('Episode ' + event.target.result.uri + ' readed from database', 'debug:IndexedDatabaseAPI');
                        episode = event.target.result;
                    } else {
                        episode = {uri: episodeUri};
                    }
                    //checks episode.updated to be a Date object
                    if (!(episode.updated instanceof Date)) {
                        episode.updated = new Date(episode.updated);
                    }
                    //generate playback object if not exists
                    if (!episode.playback) {
                        episode.playback = {'played': undefined, 'currentTime': 0};
                    }
                    if (onReadCallback && typeof onReadCallback === 'function') {
                        //Generate "playback" object if not exists
                        if (!episode.playback) {
                            episode.playback = {'played': false, 'currentTime': 0};
                        }
                        onReadCallback(episode);
                    }
                };
                request.onerror = function (event) {
                    HTML5Podcatcher.logger(event.target.error.name + ' while reading episode "' + episodeUri + '" from IndexedDB (' + event.target.error.message + ')', 'error');
                };
            };
            requestOpenDB.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
            };
        }
    };
    IndexedDbDataProvider.prototype.readPlaylist = function (showAll, onReadCallback) {
        if (!showAll) {
            showAll = false;
        }
        var requestOpenDB, provider = this;
        requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () { HTML5Podcatcher.logger("Database blocked while reading playlist", 'debug:IndexedDatabaseAPI'); };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, cursor, playlist = [];
            db = this.result;
            transaction = db.transaction([provider.getStoreNameEpisodes()], 'readonly');
            store = transaction.objectStore(provider.getStoreNameEpisodes());
            cursor = store.openCursor();
            playlist = [];
            cursor.onsuccess = function (event) {
                var result = event.target.result;
                //checks episode.updated to be a Date object
                if (result) {
                    //checks episode.updated to be a Date object
                    if (!(result.value.updated instanceof Date)) {
                        result.value.updated = new Date(result.value.updated);
                    }
                    //checks episode.playback exists
                    if (!(result.value.playback instanceof Object)) {
                        result.value.playback = {};
                    }
                    //check playback status
                    if (!result.value.playback.played || showAll === true) {
                        playlist.push(result.value);
                    }
                    result.continue();
                } else {
                    if (onReadCallback && typeof onReadCallback === 'function') {
                        playlist.sort(HTML5Podcatcher.sortEpisodes);
                        onReadCallback(playlist);
                    }
                }
            };
            cursor.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while reading playlist from IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        requestOpenDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };
    IndexedDbDataProvider.prototype.readEpisodesBySource = function (source, onReadCallback) {
        var requestOpenDB, provider = this;
        requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () { HTML5Podcatcher.logger("Database blocked", 'debug:IndexedDatabaseAPI'); };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, index, cursor, episodes = [];
            db = this.result;
            transaction = db.transaction([provider.getStoreNameEpisodes()], 'readonly');
            store = transaction.objectStore(provider.getStoreNameEpisodes());
            index = store.index("sources");
            cursor = index.openCursor(IDBKeyRange.only(source.title));
            episodes = [];
            cursor.onsuccess = function (event) {
                var result = event.target.result;
                if (result) {
                    //checks episode.updated to be a Date object
                    if (!(result.value.updated instanceof Date)) {
                        result.value.updated = new Date(result.value.updated);
                    }
                    episodes.push(result.value);
                    result.continue();
                } else {
                    if (onReadCallback && typeof onReadCallback === 'function') {
                        episodes.sort(HTML5Podcatcher.sortEpisodes);
                        onReadCallback(episodes);
                    }
                }
            };
            cursor.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while reading playlist from IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        requestOpenDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };
    IndexedDbDataProvider.prototype.writeEpisode = function (episode, onWriteCallback) {
        var requestOpenDB, provider = this;
        requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug:IndexedDatabaseAPI');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, request;
            db = this.result;
            transaction = db.transaction([provider.getStoreNameEpisodes()], 'readwrite');
            store = transaction.objectStore(provider.getStoreNameEpisodes());
            request = store.put(episode);
            // Erfolgs-Event
            request.onsuccess = function (event) {
                HTML5Podcatcher.logger('Episode ' + event.target.result + ' saved', 'info');
                if (onWriteCallback && typeof onWriteCallback === 'function') {
                    onWriteCallback(episode);
                }
            };
            request.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while saving episode "' + episode.uri + '" to IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        requestOpenDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };
    IndexedDbDataProvider.prototype.writeEpisodes = function (episodes, onWriteCallback) {
        var requestOpenDB, provider = this;
        //check parameter "episodes"
        if (episodes === 'undefined' || episodes.length === 0) {
            if (onWriteCallback && typeof onWriteCallback === 'function') {
                onWriteCallback([]);
            }
            return;
        }
        requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug:IndexedDatabaseAPI');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, request, i, saveFunction;
            db = this.result;
            i = 0;
            transaction = db.transaction([provider.getStoreNameEpisodes()], 'readwrite');
            store = transaction.objectStore(provider.getStoreNameEpisodes());
            saveFunction = function () {
                request = store.put(episodes[i]);
                request.onsuccess = function (event) {
                    HTML5Podcatcher.logger('Episode ' + event.target.result + ' saved', 'info');
                    i++;
                    if (i < episodes.length) {
                        saveFunction();
                    } else if (onWriteCallback && typeof onWriteCallback === 'function') {
                        onWriteCallback(episodes);
                    }
                };
                request.onerror = function (event) {
                    HTML5Podcatcher.logger(event.target.error.name + ' while saving episode "' + episodes[i].uri + '" to IndexedDB (' + event.target.error.message + ')', 'error');
                    episodes.splice(i, 1);
                    if (i < episodes.length) {
                        saveFunction();
                    } else if (onWriteCallback && typeof onWriteCallback === 'function') {
                        onWriteCallback(episodes);
                    }
                };
            };
            saveFunction();
        };
        requestOpenDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };

    // ====================================== //
    // === Implementation of FileProvider === //
    // ====================================== //
    /** Provides access to a file storage implemented with Indexed Database API.
    * @class
    * @implements module:HTML5Podcatcher/Storage~IFileProvider
    * @param {string} [databaseName] - The name of the database.
    * @param {number} [databaseVersion] - The version of the used database schema.
    * @param {string} [storeNameFiles] - The name of the store with BLOBs.
    */
    IndexedDbFileProvider = function (databaseName, databaseVersion) {
        var dbName = databaseName || settings.name,
            dbVersion = databaseVersion || settings.version,
            dbStoreFiles = settings.filesStore,
            dbChunkSize = settings.chunkSize;
        this.getDatabaseName = function () { return dbName; };
        this.getDatabaseVersion = function () { return dbVersion; };
        this.getStoreNameFiles = function () { return dbStoreFiles; };
        this.getChunkSize = function () { return dbChunkSize; };
        this.isSupportedByCurrentPlatform = indexedDB;
        this.priority = 100;
    };
    IndexedDbFileProvider.prototype = new HTML5Podcatcher.api.storage.IFileProvider();
    IndexedDbFileProvider.prototype.constructor = IndexedDbFileProvider;
    IndexedDbFileProvider.prototype.toString = function () {
        return "File storage provider based on Indexed Database API [Database: " + this.getDatabaseName() + " | Version: " + this.getDatabaseVersion() + "]";
    };
    IndexedDbFileProvider.prototype.updateIndexedDB = updateIndexedDB;
    IndexedDbFileProvider.prototype.cleanStorage = cleanStorage;
    // == Access on storage for BLOBs
    IndexedDbFileProvider.prototype.openFile = function (episode, onReadCallback) {
        if (episode.isFileSavedOffline) {
            HTML5Podcatcher.logger('Opening file "' + episode.mediaUrl + '" from IndexedDB starts now', 'debug:IndexedDatabaseAPI');
            var requestOpenDB, provider = this;
            requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
            requestOpenDB.onupgradeneeded = this.updateIndexedDB;
            requestOpenDB.onblocked = function () {
                HTML5Podcatcher.logger("Database blocked", 'debug:IndexedDatabaseAPI');
            };
            requestOpenDB.onsuccess = function () {
                HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
                var db, transaction, store, request;
                db = this.result;
                transaction = db.transaction([provider.getStoreNameFiles()], 'readonly');
                store = transaction.objectStore(provider.getStoreNameFiles());
                request = store.get(episode.mediaUrl);
                // Erfolgs-Event
                request.onsuccess = function (event) {
                    var objectUrl, blob;
                    //blob = new Blob([event.target.result], {type: episode.FileMimeType});
                    if (event.target.result) { //if file exists
                        blob = event.target.result;
                        objectUrl = window.URL.createObjectURL(blob);
                        episode.offlineMediaUrl = objectUrl;
                    } else { //if file is missing
                        HTML5Podcatcher.logger("Can not find offline file " + episode.mediaUrl + " in Indexed DB. Reset download state.", 'error');
                        episode.offlineMediaUrl = undefined;
                        episode.isFileSavedOffline = false;
                        HTML5Podcatcher.api.storage.StorageProvider.writeEpisode(episode);
                    }
                    if (onReadCallback && typeof onReadCallback === 'function') {
                        onReadCallback(episode);
                    }
                };
                request.onerror = function (event) {
                    HTML5Podcatcher.logger(event.target.error.name + ' while opening file "' + episode.mediaUrl + '" from IndexedDB (' + event.target.error.message + ')', 'error');
                };
            };
            requestOpenDB.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
            };
        } else {
            if (onReadCallback && typeof onReadCallback === 'function') {
                onReadCallback(episode);
            }
        }
    };
    IndexedDbFileProvider.prototype.saveFile = function (episode, content, mimeType, onWriteCallback, onProgressCallback) {
        HTML5Podcatcher.logger('Saving file "' + episode.mediaUrl + '" to IndexedDB starts now', 'debug:IndexedDatabaseAPI');
        var blob, requestOpenDB, i, chunkArray = [], provider = this;
        if (content instanceof ArrayBuffer) {
            for (i = 0; i < content.byteLength; i += this.getChunkSize()) {
                if (i + this.getChunkSize() < content.byteLength) {
                    chunkArray.push(content.slice(i, i + this.getChunkSize()));
                } else {
                    chunkArray.push(content.slice(i));
                }
            }
            blob = new Blob(chunkArray, {type: mimeType});
        } else if (content instanceof Blob) {
            blob = content;
        }
        requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug:IndexedDatabaseAPI');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, request;
            db = this.result;
            transaction = db.transaction([provider.getStoreNameFiles()], 'readwrite');
            store = transaction.objectStore(provider.getStoreNameFiles());
            request = store.put(blob, episode.mediaUrl);
            // Erfolgs-Event
            request.onsuccess = function () {
                episode.isFileSavedOffline = true;
                episode.FileMimeType = mimeType;
                HTML5Podcatcher.api.storage.StorageProvider.writeEpisode(episode);
                HTML5Podcatcher.logger('Saving file "' + episode.mediaUrl + '" to IndexedDB finished', 'info');
                if (onWriteCallback && typeof onWriteCallback === 'function') {
                    onWriteCallback(episode);
                }
            };
            request.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while saving file "' + episode.mediaUrl + '" to IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        requestOpenDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };
    IndexedDbFileProvider.prototype.deleteFile = function (episode, onDeleteCallback) {
        var requestOpenDB, provider = this;
        window.URL.revokeObjectURL(episode.offlineMediaUrl);
        if (episode && episode.mediaUrl) {
            requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
            requestOpenDB.onupgradeneeded = this.updateIndexedDB;
            requestOpenDB.onblocked = function () {
                HTML5Podcatcher.logger("Database blocked", 'debug:IndexedDatabaseAPI');
            };
            requestOpenDB.onsuccess = function () {
                HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
                var db, transaction, store, request;
                db = this.result;
                transaction = db.transaction([provider.getStoreNameFiles()], 'readwrite');
                store = transaction.objectStore(provider.getStoreNameFiles());
                request = store.delete(episode.mediaUrl);
                // Erfolgs-Event
                request.onsuccess = function () {
                    episode.isFileSavedOffline = false;
                    episode.offlineMediaUrl = undefined;
                    HTML5Podcatcher.api.storage.StorageProvider.writeEpisode(episode);
                    HTML5Podcatcher.logger('Deleting file "' + episode.mediaUrl + '" from IndexedDB finished', 'info');
                    if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                        onDeleteCallback(episode);
                    }
                };
                request.onerror = function (event) {
                    HTML5Podcatcher.logger(event.target.error.name + ' while deleting file "' + episode.mediaUrl + '" from IndexedDB (' + event.target.error.message + ')', 'error');
                };
            };
            requestOpenDB.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
            };
        } else {
            HTML5Podcatcher.logger('Nothing to delete from IndexedDB', 'info');
        }
    };
    IndexedDbFileProvider.prototype.listFiles = function (onReadCallback) {
        var requestOpenDB, provider = this;
        requestOpenDB = window.indexedDB.open(provider.getDatabaseName(), provider.getDatabaseVersion());
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () { HTML5Podcatcher.logger("Database blocked", 'debug:IndexedDatabaseAPI'); };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug:IndexedDatabaseAPI');
            var db, transaction, store, cursorRequest, filelist;
            db = this.result;
            transaction = db.transaction([provider.getStoreNameFiles()], 'readonly');
            store = transaction.objectStore(provider.getStoreNameFiles());
            cursorRequest = store.openCursor();
            filelist = [];
            cursorRequest.onsuccess = function (event) {
                var result = event.target.result;
                if (result) {
                    filelist.push(result.value);
                    result.continue();
                } else {
                    if (onReadCallback && typeof onReadCallback === 'function') {
                        onReadCallback(filelist);
                    }
                }
            };
            cursorRequest.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while reading list of sources from IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        requestOpenDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    };
    // ====================================== //
    // === Export public Elements         === //
    // ====================================== //
    return {
        'IndexedDbDataProvider': IndexedDbDataProvider,
        'IndexedDbFileProvider': IndexedDbFileProvider
    };
}());

/** The modul "IndexedDatabase" is available at document.HTML5Podcatcher.api.storage.indexedDatabase.
  * @global
  * @name "HTML5Podcatcher.api.storage.IndexedDatabase" 
  * @see module:HTML5Podcatcher/Storage/IndexedDatabase
  */
HTML5Podcatcher.api.storage.indexedDatabase = indexedDbStorageImplementation;

//Register this Implementations
HTML5Podcatcher.api.storage.StorageProvider.registerDataProvider(new HTML5Podcatcher.api.storage.indexedDatabase.IndexedDbDataProvider());
HTML5Podcatcher.api.storage.StorageProvider.registerFileProvider(new HTML5Podcatcher.api.storage.indexedDatabase.IndexedDbFileProvider());