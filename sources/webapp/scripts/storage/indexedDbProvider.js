/*  Copyright 2013-2015 Sebastian Spautz

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
HTML5Podcatcher.storage.indexedDbStorage = {
    settings: {
        name: 'HTML5Podcatcher',
        version: 7,
        sourcesStore: 'sources',
        episodesStore: 'episodes',
        filesStore: 'files',
        chunkSize: 1024 * 1024 //1 MByte
    },
    updateIndexedDB: function (event) {
        "use strict";
        HTML5Podcatcher.logger("Database Update from Version " + event.oldVersion + " to Version " + event.newVersion, 'info');
        //Migrate from Local Storage API
        if (event.oldVersion <= 4) {
            HTML5Podcatcher.storage.migradeData(HTML5Podcatcher.storage.webStorage, HTML5Podcatcher.storage.indexedDbStorage);
        }
        var db, episodeStore;
        db = this.result;
        //Add object store for sorces/feeds
        if (!db.objectStoreNames.contains(HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore)) {
            db.createObjectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore, { keyPath: 'uri' });
        }
        //Add object store for episodes
        if (!db.objectStoreNames.contains(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore)) {
            episodeStore = db.createObjectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore, { keyPath: 'uri' });
            episodeStore.createIndex('source', 'source', {unique: false});
        }
        //Add index "status" to episode store
        episodeStore = event.currentTarget.transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore);
        if (!episodeStore.indexNames.contains("status")) {
            episodeStore.createIndex("status", "playback.played", { unique: false });
        }
        //Add index "source" to episode store
        episodeStore = event.currentTarget.transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore);
        if (!episodeStore.indexNames.contains("sources")) {
            episodeStore.createIndex("sources", "source", { unique: false });
        }
        //Add object store for Files
        if (!db.objectStoreNames.contains(HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore)) {
            db.createObjectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore, {});
        }
    },
    cleanStorage: function (onDeleteCallback) {
        "use strict";
        var requestDeleteDB = window.indexedDB.deleteDatabase(this.settings.name);
        requestDeleteDB.onsuccess = function () {
            HTML5Podcatcher.logger("Indexed database deleted", 'info');
            if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                onDeleteCallback();
            }
        };
        requestDeleteDB.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " deleting IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    },
    //Source Storage
    readSource: function (sourceUri, onReadCallback) {
        "use strict";
        var requestOpenDB;
        requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, request;
            db = this.result;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore], 'readonly');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore);
            request = store.get(sourceUri);
            // Erfolgs-Event
            request.onsuccess = function (event) {
                var source;
                if (event.target.result) {
                    HTML5Podcatcher.logger('Source ' + event.target.result.uri + ' readed from database', 'debug');
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
    },
    readSources: function (onReadCallback) {
        "use strict";
        var request;
        request = window.indexedDB.open(this.settings.name, this.settings.version);
        request.onupgradeneeded = this.updateIndexedDB;
        request.onblocked = function () { HTML5Podcatcher.logger("Database blocked", 'debug'); };
        request.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, cursorRequest, sourcelist;
            db = this.result;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore], 'readonly');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore);
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
    },
    writeSource: function (source, onWriteCallback) {
        "use strict";
        var requestOpenDB;
        requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, request;
            db = this.result;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore], 'readwrite');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore);
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
    },
    writeSources: function (sources, onWriteCallback) {
        "use strict";
        var requestOpenDB;
        requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, request, i, saveFunction;
            db = this.result;
            i = 0;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore], 'readwrite');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore);
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
    },
    deleteSource: function (source, onDeleteCallback) {
        "use strict";
        var requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, request;
            db = this.result;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore], 'readwrite');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore);
            request = store.delete(source.uri);
            request.onsuccess = function () {
                HTML5Podcatcher.logger('Source ' + source.uri + ' deleted from database', 'debug');
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
    },
    //Episode Storage
    readEpisode: function (episodeUri, onReadCallback) {
        "use strict";
        var requestOpenDB;
        if (episodeUri) {
            requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
            requestOpenDB.onupgradeneeded = this.updateIndexedDB;
            requestOpenDB.onblocked = function () {
                HTML5Podcatcher.logger("Database blocked", 'debug');
            };
            requestOpenDB.onsuccess = function () {
                HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
                var db, transaction, store, request;
                db = this.result;
                transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore], 'readonly');
                store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore);
                request = store.get(episodeUri);
                // Erfolgs-Event
                request.onsuccess = function (event) {
                    var episode;
                    if (event.target.result) {
                        HTML5Podcatcher.logger('Episode ' + event.target.result.uri + ' readed from database', 'debug');
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
    },
    readPlaylist: function (showAll, onReadCallback) {
        "use strict";
        if (!showAll) {
            showAll = false;
        }
        var request;
        request = window.indexedDB.open(this.settings.name, this.settings.version);
        request.onupgradeneeded = this.updateIndexedDB;
        request.onblocked = function () { HTML5Podcatcher.logger("Database blocked", 'debug'); };
        request.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, cursor, playlist = [];
            db = this.result;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore], 'readonly');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore);
            cursor = store.openCursor();
            playlist = [];
            cursor.onsuccess = function (event) {
                var result = event.target.result;
                //checks episode.updated to be a Date object
                if (result) {
                    if (!(result.value.updated instanceof Date)) {
                        result.value.updated = new Date(result.value.updated);
                    }
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
            request.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while reading playlist from IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        request.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    },
    readEpisodesBySource: function (source, onReadCallback) {
        "use strict";
        var request;
        request = window.indexedDB.open(this.settings.name, this.settings.version);
        request.onupgradeneeded = this.updateIndexedDB;
        request.onblocked = function () { HTML5Podcatcher.logger("Database blocked", 'debug'); };
        request.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, index, cursor, episodes = [];
            db = this.result;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore], 'readonly');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore);
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
            request.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while reading playlist from IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        request.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    },
    writeEpisode: function (episode, onWriteCallback) {
        "use strict";
        var requestOpenDB;
        requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, request;
            db = this.result;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore], 'readwrite');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore);
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
    },
    writeEpisodes: function (episodes, onWriteCallback) {
        "use strict";
        var requestOpenDB;
        requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, request, i, saveFunction;
            db = this.result;
            i = 0;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore], 'readwrite');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore);
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
    },
    //File Storage
    openFile: function (episode, onReadCallback) {
        "use strict";
        if (episode.isFileSavedOffline) {
            HTML5Podcatcher.logger('Opening file "' + episode.mediaUrl + '" from IndexedDB starts now', 'debug');
            var requestOpenDB;
            requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
            requestOpenDB.onupgradeneeded = this.updateIndexedDB;
            requestOpenDB.onblocked = function () {
                HTML5Podcatcher.logger("Database blocked", 'debug');
            };
            requestOpenDB.onsuccess = function () {
                HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
                var db, transaction, store, request;
                db = this.result;
                transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore], 'readonly');
                store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore);
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
                        HTML5Podcatcher.storage.writeEpisode(episode);
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
    },
    saveFile: function (episode, content, mimeType, onWriteCallback, onProgressCallback) {
        "use strict";
        HTML5Podcatcher.logger('Saving file "' + episode.mediaUrl + '" to IndexedDB starts now', 'debug');
        var blob, requestOpenDB, i, chunkArray = [];
        if (content instanceof ArrayBuffer) {
            for (i = 0; i < content.byteLength; i += this.settings.chunkSize) {
                if (i + this.settings.chunkSize < content.byteLength) {
                    chunkArray.push(content.slice(i, i + this.settings.chunkSize));
                } else {
                    chunkArray.push(content.slice(i));
                }
            }
            blob = new Blob(chunkArray, {type: mimeType});
        } else if (content instanceof Blob) {
            blob = content;
        }
        requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
        requestOpenDB.onupgradeneeded = this.updateIndexedDB;
        requestOpenDB.onblocked = function () {
            HTML5Podcatcher.logger("Database blocked", 'debug');
        };
        requestOpenDB.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, request;
            db = this.result;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore], 'readwrite');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore);
            request = store.put(blob, episode.mediaUrl);
            // Erfolgs-Event
            request.onsuccess = function () {
                episode.isFileSavedOffline = true;
                episode.FileMimeType = mimeType;
                HTML5Podcatcher.storage.writeEpisode(episode);
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
    },
    deleteFile: function (episode, onDeleteCallback) {
        "use strict";
        var requestOpenDB;
        window.URL.revokeObjectURL(episode.offlineMediaUrl);
        if (episode && episode.mediaUrl) {
            requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
            requestOpenDB.onupgradeneeded = this.updateIndexedDB;
            requestOpenDB.onblocked = function () {
                HTML5Podcatcher.logger("Database blocked", 'debug');
            };
            requestOpenDB.onsuccess = function () {
                HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
                var db, transaction, store, request;
                db = this.result;
                transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore], 'readwrite');
                store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore);
                request = store.delete(episode.mediaUrl);
                // Erfolgs-Event
                request.onsuccess = function () {
                    episode.isFileSavedOffline = false;
                    episode.offlineMediaUrl = undefined;
                    HTML5Podcatcher.storage.writeEpisode(episode);
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
    },
    listFiles: function (onReadCallback) {
        "use strict";
        var request;
        request = window.indexedDB.open(this.settings.name, this.settings.version);
        request.onupgradeneeded = this.updateIndexedDB;
        request.onblocked = function () { HTML5Podcatcher.logger("Database blocked", 'debug'); };
        request.onsuccess = function () {
            HTML5Podcatcher.logger("Success creating/accessing IndexedDB database", 'debug');
            var db, transaction, store, cursorRequest, filelist;
            db = this.result;
            transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore], 'readonly');
            store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore);
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
            request.onerror = function (event) {
                HTML5Podcatcher.logger(event.target.error.name + ' while reading list of sources from IndexedDB (' + event.target.error.message + ')', 'error');
            };
        };
        request.onerror = function (event) {
            HTML5Podcatcher.logger(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
        };
    }
};