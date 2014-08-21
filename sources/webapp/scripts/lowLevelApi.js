/*  Copyright 2013, 2014 Sebastian Spautz

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
/*global navigator */
/*global window */
/*global document */
/*global console */
/*global CustomEvent */
/*global XMLHttpRequest */
/*global Blob */
/*global localStorage */
/*global jQuery */
var HTML5Podcatcher = {
    version: "Alpha {{ VERSION }}",
    settings: {
        uiLogger: undefined
    },
    storage: {
        indexedDbStorage: {
            settings: {
                name: 'HTML5Podcatcher',
                version: 5.0,
                sourcesStore: 'sources',
                episodesStore: 'episodes',
                filesStore: 'files'
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
                if (!db.objectStoreNames.contains(HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore)) {
                    db.createObjectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.sourcesStore, { keyPath: 'uri' });
                }
                if (!db.objectStoreNames.contains(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore)) {
                    episodeStore = db.createObjectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore, { keyPath: 'uri' });
                    episodeStore.createIndex('source', 'source', {unique: false});
                }
                if (!db.objectStoreNames.contains(HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore)) {
                    db.createObjectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.filesStore, {});
                }
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
                            //generate playback object if not exists
                            if (!episode.playback) {
                                episode.playback = {'played': false, 'currentTime': 0};
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
                    var db, transaction, store, cursorRequest, playlist = [];
                    db = this.result;
                    transaction = db.transaction([HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore], 'readonly');
                    store = transaction.objectStore(HTML5Podcatcher.storage.indexedDbStorage.settings.episodesStore);
                    cursorRequest = store.openCursor();
                    playlist = [];
                    cursorRequest.onsuccess = function (event) {
                        var result = event.target.result;
                        if (result) {
                            if (result.value.playback.played === false || showAll === true) {
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
            saveFile: function (episode, arraybuffer, mimeType, onWriteCallback, onProgressCallback) {
                "use strict";
                HTML5Podcatcher.logger('Saving file "' + episode.mediaUrl + '" to IndexedDB starts now', 'debug');
                var blob, requestOpenDB;
                blob = new Blob([arraybuffer], {type: mimeType});
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
            }
        },//end IndexedDbStorage
        fileSystemStorage: {
            settings: {
                fileSystemSize: 1024 * 1024 * 500, /*500 MB */
                fileSystemStatus: window.PERSISTENT
            },
            saveFile: function (episode, arraybuffer, mimeType, onWriteCallback, onProgressCallback) {
                "use strict";
                HTML5Podcatcher.logger('Saving file "' + episode.mediaUrl + '" to local file system starts now', 'debug');
                var blob, parts, fileName;
                blob = new Blob([arraybuffer], {type: mimeType});
                parts = episode.mediaUrl.split('/');
                fileName = parts[parts.length - 1];
                // Write file to the root directory.
                window.requestFileSystem(this.settings.fileSystemStatus, this.settings.fileSystemSize, function (filesystem) {
                    filesystem.root.getFile(fileName, {create: true, exclusive: false}, function (fileEntry) {
                        fileEntry.createWriter(function (writer) {
                            writer.onwrite = function (event) {
                                if (onProgressCallback && typeof onProgressCallback === 'function') {
                                    onProgressCallback(event, 'Write', episode);
                                }
                            };
                            writer.onwriteend = function () { //success
                                episode.isFileSavedOffline = true;
                                episode.offlineMediaUrl = fileEntry.toURL();
                                HTML5Podcatcher.storage.writeEpisode(episode);
                                HTML5Podcatcher.logger('Saving file "' + episode.mediaUrl + '" to local file system finished', 'info');
                                if (onWriteCallback && typeof onWriteCallback === 'function') {
                                    onWriteCallback(episode);
                                }
                            };
                            writer.onerror = function (event) {
                                HTML5Podcatcher.logger('Error on saving file "' + episode.mediaUrl + '" to local file system (' + event + ')', 'error');
                            };
                            writer.write(blob);
                        }, HTML5Podcatcher.errorLogger);
                    }, HTML5Podcatcher.errorLogger);
                }, HTML5Podcatcher.errorLogger);
            },
            deleteFile: function (episode, onDeleteCallback) {
                "use strict";
                window.resolveLocalFileSystemURL(episode.offlineMediaUrl, function (fileEntry) { //success
                    fileEntry.remove(function () { //success
                        var url;
                        url = episode.offlineMediaUrl;
                        episode.isFileSavedOffline = false;
                        episode.offlineMediaUrl = undefined;
                        HTML5Podcatcher.storage.writeEpisode(episode);
                        HTML5Podcatcher.logger('Deleting file "' + url + '" finished', 'info');
                        if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                            onDeleteCallback(episode);
                        }
                    }, HTML5Podcatcher.errorLogger);
                }, function (event) { //error
                    if (event.code === event.NOT_FOUND_ERR) {
                        var url;
                        url = episode.offlineMediaUrl;
                        episode.offlineMediaUrl = undefined;
                        HTML5Podcatcher.storage.writeEpisode(episode);
                        HTML5Podcatcher.logger('File "' + url + '"not found. But that\'s OK', 'info');
                    } else {
                        HTML5Podcatcher.logger(event, 'error');
                    }
                });
            },
            openFile: function (episode, onReadCallback) {
                "use strict";
                if (onReadCallback && typeof onReadCallback === 'function') {
                    onReadCallback(episode);
                }
            },
            requestFileSystemQuota: function (quota) {
                "use strict";
                if (navigator.persistentStorage) {
                    navigator.persistentStorage.requestQuota(quota, function (grantedBytes) {
                        HTML5Podcatcher.logger('You gain access to ' + grantedBytes / 1024 / 1024 + ' MiB of memory', 'debug');
                        navigator.persistentStorage.queryUsageAndQuota(function (usage, quota) {
                            localStorage.setItem("configuration.quota", quota);
                            var availableSpace = quota - usage;
                            jQuery('#memorySizeInput').val(quota / 1024 / 1024).attr('min', Math.ceil(usage / 1024 / 1024)).css('background', 'linear-gradient( 90deg, rgba(0,100,0,0.45) ' + Math.ceil((usage / quota) * 100) + '%, transparent ' + Math.ceil((usage / quota) * 100) + '%, transparent )');
                            if (availableSpace <= (1024 * 1024 * 50)) {
                                HTML5Podcatcher.logger('You are out of space! Please allow more then ' + Math.ceil(quota / 1024 / 1024) + ' MiB of space', 'warning');
                            } else {
                                HTML5Podcatcher.logger('There is ' + Math.floor(availableSpace / 1024 / 1024) + ' MiB of ' + Math.floor(quota / 1024 / 1024) + ' MiB memory available', 'info');
                            }
                        }, HTML5Podcatcher.errorLogger);
                    }, HTML5Podcatcher.errorLogger);
                }
            }
        },//end FileSystemStorage
        webStorage: {
            readSource: function (sourceUri, onReadCallback) {
                "use strict";
                var source;
                source = JSON.parse(localStorage.getItem('source.' + sourceUri));
                if (!source) {
                    source = { 'uri': sourceUri };
                }
                if (onReadCallback && typeof onReadCallback === 'function') {
                    onReadCallback(source);
                }
            },
            /* Get a Array with all Sources from the persistent storage */
            readSources: function (onReadCallback) {
                "use strict";
                var pushFunction, i, sourceArray = [];
                pushFunction = function (source) {
                    sourceArray.push(source);
                };
                for (i = 0; i < localStorage.length; i++) {
                    if (localStorage.key(i).slice(0, 7) === 'source.') {
                        this.readSource(localStorage.key(i).substring(7), pushFunction);
                    }
                }
                if (onReadCallback && typeof onReadCallback === 'function') {
                    onReadCallback(sourceArray);
                }
            },
            writeSource: function (source, onWriteCallback) {
                "use strict";
                localStorage.setItem('source.' + source.uri, JSON.stringify(source));
                if (onWriteCallback && typeof onWriteCallback === 'function') {
                    onWriteCallback(source);
                }
            },
            deleteSource: function (source, onDeleteCallback) {
                "use strict";
                localStorage.removeItem('source.' + source.uri);
                if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                    onDeleteCallback(source);
                }
            },
            readEpisode: function (episodeUri, onReadCallback) {
                "use strict";
                var episode;
                if (episodeUri) {
                    //Read Episode from local DOM-Storage
                    episode = JSON.parse(localStorage.getItem('episode.' + episodeUri));
                    if (!episode) {
                        episode = { 'uri': episodeUri };
                    }
                    //Convert "updated" to date object
                    episode.updated = new Date(episode.updated);
                    //Generate "playback" object if not exists
                    if (!episode.playback) {
                        episode.playback = {'played': false, 'currentTime': 0};
                    }
                }
                if (onReadCallback && typeof onReadCallback === 'function') {
                    onReadCallback(episode);
                }
            },
            readPlaylist: function (showAll, onReadCallback) {
                "use strict";
                if (!showAll) {
                    showAll = false;
                }
                var i, filter, playlist = [];
                filter = function (episode) {
                    if (episode.playback.played === false || showAll === true) {
                        playlist.push(episode);
                    }
                };
                for (i = 0; i < localStorage.length; i++) {
                    if (localStorage.key(i).slice(0, 8) === 'episode.') {
                        this.readEpisode(localStorage.key(i).substring(8), filter);
                    }
                }
                playlist.sort(HTML5Podcatcher.sortEpisodes);

                if (onReadCallback && typeof onReadCallback === 'function') {
                    onReadCallback(playlist);
                }
            },
            writeEpisode: function (episode, onWriteCallback) {
                "use strict";
                localStorage.setItem('episode.' + episode.uri, JSON.stringify(episode));
                if (onWriteCallback && typeof onWriteCallback === 'function') {
                    onWriteCallback(episode);
                }
            }
        },//end WebStorage
        //Source Storage
        readSource: function (sourceUri, onReadCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().readSource(sourceUri, onReadCallback);
            }
        },
        readSources: function (onReadCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().readSources(onReadCallback);
            }
        },
        writeSource: function (source, onWriteCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().writeSource(source, function (source) {
                    if (onWriteCallback && typeof onWriteCallback === 'function') {
                        onWriteCallback(source);
                    }
                    document.dispatchEvent(new CustomEvent('writeSource', {"detail": {'source': source}}));
                });
            }
        },
        deleteSource: function (source, onDeleteCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().deleteSource(source, onDeleteCallback);
            }
        },
        //Episode Storage
        readEpisode: function (episodeUri, onReadCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().readEpisode(episodeUri, onReadCallback);
            }
        },
        readPlaylist: function (showAll, onReadCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().readPlaylist(showAll, onReadCallback);
            }
        },
        writeEpisode: function (episode, onWriteCallback) {
            "use strict";
            if (this.dataStorageEngine()) {
                this.dataStorageEngine().writeEpisode(episode, function (episode) {
                    if (onWriteCallback && typeof onWriteCallback === 'function') {
                        onWriteCallback(episode);
                    }
                    document.dispatchEvent(new CustomEvent('writeEpisode', {"detail": {'episode': episode}}));
                });
            }
        },
        //File Storage
        openFile: function (episode, onReadCallback) {
            "use strict";
            if (episode.isFileSavedOffline) {
                if (this.fileStorageEngine()) {
                    this.fileStorageEngine().openFile(episode, onReadCallback);
                }
            } else {
                if (onReadCallback && typeof onReadCallback === 'function') {
                    onReadCallback(episode);
                }
            }
        },
        saveFile: function (episode, arraybuffer, mimeType, onWriteCallback, onProgressCallback) {
            "use strict";
            if (this.fileStorageEngine()) {
                this.fileStorageEngine().saveFile(episode, arraybuffer, mimeType, onWriteCallback, onProgressCallback);
            }
        },
        deleteFile: function (episode, onDeleteCallback) {
            "use strict";
            if (this.fileStorageEngine()) {
                this.fileStorageEngine().deleteFile(episode, onDeleteCallback);
            }
        },
        //Storage Engine Selection
        dataStorageEngine: function () {
            "use strict";
            var engine;
            if (window.indexedDB) {
                engine = this.indexedDbStorage;
            } else if (window.localStorage) {
                engine = this.webStorage;
            } else {
                HTML5Podcatcher.logger("Missing persistent data storage", "error");
            }
            return engine;
        },
        fileStorageEngine: function () {
            "use strict";
            var engine;
            if (window.requestFileSystem) {
                engine = this.fileSystemStorage;
            } else if (window.indexedDB) {
                engine = this.indexedDbStorage;
            } else {
                HTML5Podcatcher.logger("Missing persistent file storage", "error");
            }
            return engine;
        },
        isFileStorageAvailable: function () {
            "use strict";
            return this.fileStorageEngine();
        },
        //Migration betwean storage engines
        migradeData: function (oldStorageEngine, newStorageEngine) {
            "use strict";
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
        }
    },
    web: {
        settings: {
            downloadTimeout: 600000
        },
        downloadSource: function (source) {
            "use strict";
            var successfunction, errorfunction, parserresult, xhr;
            parserresult = {'source': source, 'episodes': []};
            successfunction = function () {
                var data, newestEpisodes, mergeFunction, i;
                HTML5Podcatcher.logger('Download of source "' + source.uri + '" is finished', 'debug');
                data = this.responseXML;
                mergeFunction = function (mergeEpisode) {
                    HTML5Podcatcher.storage.readEpisode(mergeEpisode.uri, function (existingEpisode) {
                        existingEpisode.title = mergeEpisode.title;
                        existingEpisode.updated = mergeEpisode.updated;
                        existingEpisode.mediaUrl = mergeEpisode.mediaUrl;
                        existingEpisode.source = mergeEpisode.source;
                        //ATTENTION! never change playback information if episode updated from internet
                        HTML5Podcatcher.storage.writeEpisode(existingEpisode);
                    });
                };
                //Call XML-Parser 
                if (!data) {
                    HTML5Podcatcher.logger('No XML Document found instead found [' + this.response + "]", 'error');
                } else {
                    parserresult = HTML5Podcatcher.parser.parseSource(data, source);
                    //compute parser result
                    // 1. merge existing data with actual one
                    // TODO writing a multi episode write method
                    // 2. filter top 5 episodes and check if unread
                    newestEpisodes = parserresult.episodes.slice(parserresult.episodes.length - 5, parserresult.episodes.length);
                    // 3. save top 5 episodes with actualised data
                    for (i = 0; i < newestEpisodes.length; i++) {
                        mergeFunction(newestEpisodes[i]);
                    }
                    // 4. Save Source
                    HTML5Podcatcher.storage.writeSource(source);
                }
            };
            errorfunction = function (xhrError) {
                if (localStorage.getItem("configuration.proxyUrl")) {
                    HTML5Podcatcher.logger('Direct download failed. Try proxy: ' + localStorage.getItem("configuration.proxyUrl").replace("$url$", source.uri), 'warning');
                    var proxyXhr = new XMLHttpRequest({ mozSystem: true });
                    proxyXhr.open('GET', localStorage.getItem("configuration.proxyUrl").replace("$url$", source.uri), true);
                    proxyXhr.addEventListener("error", function (xhrError) {
                        HTML5Podcatcher.logger("Can't download Source: " + xhrError.error);
                    });
                    proxyXhr.addEventListener("abort", HTML5Podcatcher.logger, false);
                    proxyXhr.onload = successfunction;
                    proxyXhr.ontimeout = function () {
                        HTML5Podcatcher.logger("Timeout after " + (proxyXhr.timeout / 60000) + " minutes.", "error");
                    };
                    proxyXhr.send();
                    /*jQuery.ajax({
                        'url': localStorage.getItem("configuration.proxyUrl").replace("$url$", source.uri),
                        'async': true,
                        'dataType': 'xml',
                        'success': successfunction,
                        'error': function (xhrError) {
                            HTML5Podcatcher.logger("Can't download Source: " + xhrError.error);
                        }
                    });*/
                } else {
                    HTML5Podcatcher.logger("Can't download Source: " + xhrError.error);
                }
            };
            //Load Feed and Parse Entries
            try {
                xhr = new XMLHttpRequest({ mozSystem: true });
                xhr.open('GET', source.uri, true);
                xhr.addEventListener("error", errorfunction);
                xhr.addEventListener("abort", HTML5Podcatcher.logger, false);
                xhr.onload = successfunction;
                xhr.ontimeout = function () {
                    HTML5Podcatcher.logger("Timeout after " + (xhr.timeout / 60000) + " minutes.", "error");
                };
                xhr.send();
                /*jQuery.ajax({
                    'url': source.uri,
                    'async': true,
                    'dataType': 'xml',
                    'beforeSend': function (jqXHR, settings) { jqXHR.requestURL = settings.url; },
                    'success': successfunction,
                    'error': errorfunction
                });*/
            } catch (ex) {
                HTML5Podcatcher.logger(ex, 'error');
            }
        },
        downloadFile: function (episode, mimeType, onDownloadCallback, onProgressCallback) {
            "use strict";
            var xhr = new XMLHttpRequest({ mozSystem: true });
            xhr.open('GET', episode.mediaUrl, true);
            xhr.responseType = 'arraybuffer';
            xhr.timeout = HTML5Podcatcher.web.settings.downloadTimeout;
            xhr.addEventListener("progress", function (event) {
                if (onProgressCallback && typeof onProgressCallback === 'function') {
                    onProgressCallback(event, 'Download', episode);
                }
            }, false);
            xhr.addEventListener("abort", HTML5Podcatcher.logger, false);
            xhr.addEventListener("error", function () {
                HTML5Podcatcher.logger('Direct download failed. Try proxy: ' + localStorage.getItem("configuration.proxyUrl").replace("$url$", episode.mediaUrl), 'warning');
                var xhrProxy = new XMLHttpRequest();
                xhrProxy.open('GET', localStorage.getItem("configuration.proxyUrl").replace("$url$", episode.mediaUrl), true);
                xhrProxy.responseType = 'arraybuffer';
                xhrProxy.timeout = HTML5Podcatcher.web.settings.downloadTimeout;
                xhrProxy.addEventListener("progress", function (event) {
                    if (onProgressCallback && typeof onProgressCallback === 'function') {
                        onProgressCallback(event, 'Download', episode);
                    }
                }, false);
                xhrProxy.addEventListener("abort", HTML5Podcatcher.logger, false);
                xhrProxy.addEventListener("error", HTML5Podcatcher.errorLogger, false);
                xhrProxy.onload = function () {
                    if (this.status === 200) {
                        HTML5Podcatcher.logger('Download of file "' + episode.mediaUrl + '" via proxy is finished', 'debug');
                        HTML5Podcatcher.storage.saveFile(episode, xhrProxy.response, mimeType, onDownloadCallback);
                    } else {
                        HTML5Podcatcher.logger('Error Downloading file "' + episode.mediaUrl + '" via proxy: ' + this.statusText + ' (' + this.status + ')', 'error');
                    }
                };
                xhrProxy.ontimeout = function () {
                    HTML5Podcatcher.logger("Timeout after " + (xhrProxy.timeout / 60000) + " minutes.", "error");
                };
                xhrProxy.send(null);
            }, false);
            xhr.onload = function () {
                if (this.status === 200) {
                    HTML5Podcatcher.logger('Download of file "' + episode.mediaUrl + '" is finished', 'debug');
                    HTML5Podcatcher.storage.saveFile(episode, xhr.response, mimeType, onDownloadCallback, onProgressCallback);
                } else {
                    HTML5Podcatcher.logger('Error Downloading file "' + episode.mediaUrl + '": ' + this.statusText + ' (' + this.status + ')', 'error');
                }
            };
            xhr.ontimeout = function () {
                HTML5Podcatcher.logger("Timeout after " + (xhr.timeout / 60000) + " minutes.", "error");
            };
            xhr.send(null);
        }
    },
    parser: {
        parseSource: function (xml, source) {
            "use strict";
            var episodes = [];
            HTML5Podcatcher.logger('Parsing source file "' + source.uri + '" starts now', 'debug');
            //RSS-Feed
            if (jQuery(xml).has('rss[version="2.0"]')) {
                //RSS-Channel
                source.link = jQuery(xml).find('channel > link').text();
                source.title = jQuery(xml).find('channel > title').text();
                source.description = jQuery(xml).find('channel > description').text();
                //RSS-Entries
                jQuery(xml).find('item').each(function () {
                    var item, episode;
                    item = jQuery(this);
                    episode = {};
                    episode.uri = item.find('link, guid').first().text();
                    episode.title = item.find('title:first').text();
                    if (/^\d/.test(item.find('pubDate:first').text())) {
                        episode.updated = new Date("Sun " + item.find('pubDate:first').text());
                    } else {
                        episode.updated = new Date(item.find('pubDate:first').text());
                    }
                    episode.source = source.title;
                    if (item.find('enclosure').length > 0) {
                        episode.mediaUrl = item.find('enclosure:first').attr('url');
                    } else if (jQuery(item.find('encoded').text()).find('a[href$=".mp3"]').length > 0) {
                        episode.mediaUrl = jQuery(item.find('encoded').text()).find('a[href$=".mp3"]').first().attr('href');
                    }
                    episodes.push(episode);
                });
                episodes.sort(HTML5Podcatcher.sortEpisodes);
            } else {
                HTML5Podcatcher.logger('No root element (&lt;rss&gt;) found in response: ' + xml, 'error');
            }
            HTML5Podcatcher.logger('Parsing source file "' + source.uri + '" finished (found ' + episodes.length + ' episodes for "' + source.title + '")', 'info');
            return {'source': source, 'episodes': episodes};
        }
    },
    toggleEpisodeStatus: function (episode) {
        "use strict";
        episode.playback.played = !episode.playback.played;
        episode.playback.currentTime = 0;
        HTML5Podcatcher.storage.deleteFile(episode);
        HTML5Podcatcher.storage.writeEpisode(episode);
    },
    sortEpisodes: function (firstEpisode, secondEpisode) {
        "use strict";
        if (firstEpisode.updated < secondEpisode.updated) {
            return -1;
        }
        if (firstEpisode.updated > secondEpisode.updated) {
            return 1;
        }
        return 0;
    },
    logger: function (message, level) {
        "use strict";
        if (HTML5Podcatcher.settings.uiLogger && typeof HTML5Podcatcher.settings.uiLogger === 'function') {
            HTML5Podcatcher.settings.uiLogger(message, level);
        } else {
            console.log(level + ': ' + message);
        }
    },
    errorLogger: function (message) {
        "use strict";
        HTML5Podcatcher.logger(message, 'error');
    }
};
var POD = HTML5Podcatcher;