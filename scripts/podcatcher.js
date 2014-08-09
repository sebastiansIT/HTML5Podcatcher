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
/*global alert */
/*global Blob */
/*global XMLHttpRequest */
/*global localStorage */
/*global applicationCache */
/*global $ */
/*global CustomEvent */

/** Helper Functions */
var escapeHtml = function (text) {
    "use strict";
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
};
var logHandler = function (message, loglevel) {
    "use strict";
    console.log(loglevel + ': ' + message);
    $('#statusbar').prepend('<span class=' + loglevel + '>' + message + '</span></br>');
};
var errorHandler = function (event) {
    "use strict";
    var eventstring = event.toString() + ' {';
    $.each(event, function (i, n) {
        eventstring += i + ': "' + n + '"; ';
    });
    eventstring += '}';
    logHandler(escapeHtml(eventstring), 'error');
};
var successHandler = function (event) {
    "use strict";
    logHandler(event, 'info');
};

var POD = {
    version: "Alpha {{ VERSION }}",
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
                logHandler("Database Update from Version " + event.oldVersion + " to Version " + event.newVersion, 'info');
                //Migrate from Local Storage API
                if (event.oldVersion <= 4) {
                    POD.storage.migradeData(POD.storage.webStorage, POD.storage.indexedDbStorage);
                }
                var db, episodeStore;
                db = this.result;
                if (!db.objectStoreNames.contains(POD.storage.indexedDbStorage.settings.sourcesStore)) {
                    db.createObjectStore(POD.storage.indexedDbStorage.settings.sourcesStore, { keyPath: 'uri' });
                }
                if (!db.objectStoreNames.contains(POD.storage.indexedDbStorage.settings.episodesStore)) {
                    episodeStore = db.createObjectStore(POD.storage.indexedDbStorage.settings.episodesStore, { keyPath: 'uri' });
                    episodeStore.createIndex('source', 'source', {unique: false});
                }
                if (!db.objectStoreNames.contains(POD.storage.indexedDbStorage.settings.filesStore)) {
                    db.createObjectStore(POD.storage.indexedDbStorage.settings.filesStore, {});
                }
            },
            //Source Storage
            readSource: function (sourceUri, onReadCallback) {
                "use strict";
                var requestOpenDB;
                requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
                requestOpenDB.onupgradeneeded = this.updateIndexedDB;
                requestOpenDB.onblocked = function () {
                    logHandler("Database blocked", 'debug');
                };
                requestOpenDB.onsuccess = function () {
                    logHandler("Success creating/accessing IndexedDB database", 'debug');
                    var db, transaction, store, request;
                    db = this.result;
                    transaction = db.transaction([POD.storage.indexedDbStorage.settings.sourcesStore], 'readonly');
                    store = transaction.objectStore(POD.storage.indexedDbStorage.settings.sourcesStore);
                    request = store.get(sourceUri);
                    // Erfolgs-Event
                    request.onsuccess = function (event) {
                        var source;
                        if (event.target.result) {
                            logHandler('Source ' + event.target.result.uri + ' readed from database', 'debug');
                            source = event.target.result;
                        } else {
                            source = { 'uri': sourceUri };
                        }
                        if (onReadCallback && typeof onReadCallback === 'function') {
                            onReadCallback(source);
                        }
                    };
                    request.onerror = function (event) {
                        logHandler(event.target.error.name + ' while reading source "' + sourceUri + '" from IndexedDB (' + event.target.error.message + ')', 'error');
                    };
                };
                requestOpenDB.onerror = function (event) {
                    logHandler(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
                };
            },
            readSources: function (onReadCallback) {
                "use strict";
                var request;
                request = window.indexedDB.open(this.settings.name, this.settings.version);
                request.onupgradeneeded = this.updateIndexedDB;
                request.onblocked = function () { logHandler("Database blocked", 'debug'); };
                request.onsuccess = function () {
                    logHandler("Success creating/accessing IndexedDB database", 'debug');
                    var db, transaction, store, cursorRequest, sourcelist;
                    db = this.result;
                    transaction = db.transaction([POD.storage.indexedDbStorage.settings.sourcesStore], 'readonly');
                    store = transaction.objectStore(POD.storage.indexedDbStorage.settings.sourcesStore);
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
                        logHandler(event.target.error.name + ' while reading list of sources from IndexedDB (' + event.target.error.message + ')', 'error');
                    };
                };
                request.onerror = function (event) {
                    logHandler(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
                };
            },
            writeSource: function (source, onWriteCallback) {
                "use strict";
                var requestOpenDB;
                requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
                requestOpenDB.onupgradeneeded = this.updateIndexedDB;
                requestOpenDB.onblocked = function () {
                    logHandler("Database blocked", 'debug');
                };
                requestOpenDB.onsuccess = function () {
                    logHandler("Success creating/accessing IndexedDB database", 'debug');
                    var db, transaction, store, request;
                    db = this.result;
                    transaction = db.transaction([POD.storage.indexedDbStorage.settings.sourcesStore], 'readwrite');
                    store = transaction.objectStore(POD.storage.indexedDbStorage.settings.sourcesStore);
                    request = store.put(source);
                    // Erfolgs-Event
                    request.onsuccess = function (event) {
                        logHandler('Source ' + event.target.result + ' saved', 'info');
                        if (onWriteCallback && typeof onWriteCallback === 'function') {
                            onWriteCallback(source);
                        }
                    };
                    request.onerror = function (event) {
                        logHandler(event.target.error.name + ' while saving source "' + source.uri + '" to IndexedDB (' + event.target.error.message + ')', 'error');
                    };
                };
                requestOpenDB.onerror = function (event) {
                    logHandler(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
                };
            },
            deleteSource: function (source, onDeleteCallback) {
                "use strict";
                var requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
                requestOpenDB.onupgradeneeded = this.updateIndexedDB;
                requestOpenDB.onblocked = function () {
                    logHandler("Database blocked", 'debug');
                };
                requestOpenDB.onsuccess = function () {
                    logHandler("Success creating/accessing IndexedDB database", 'debug');
                    var db, transaction, store, request;
                    db = this.result;
                    transaction = db.transaction([POD.storage.indexedDbStorage.settings.sourcesStore], 'readwrite');
                    store = transaction.objectStore(POD.storage.indexedDbStorage.settings.sourcesStore);
                    request = store.delete(source.uri);
                    request.onsuccess = function () {
                        logHandler('Source ' + source.uri + ' deleted from database', 'debug');
                        if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                            onDeleteCallback(source);
                        }
                    };
                    request.onerror = function (event) {
                        logHandler(event.target.error.name + ' while deleting source "' + source.uri + '" from IndexedDB (' + event.target.error.message + ')', 'error');
                    };
                };
                requestOpenDB.onerror = function (event) {
                    logHandler(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
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
                        logHandler("Database blocked", 'debug');
                    };
                    requestOpenDB.onsuccess = function () {
                        logHandler("Success creating/accessing IndexedDB database", 'debug');
                        var db, transaction, store, request;
                        db = this.result;
                        transaction = db.transaction([POD.storage.indexedDbStorage.settings.episodesStore], 'readonly');
                        store = transaction.objectStore(POD.storage.indexedDbStorage.settings.episodesStore);
                        request = store.get(episodeUri);
                        // Erfolgs-Event
                        request.onsuccess = function (event) {
                            var episode;
                            if (event.target.result) {
                                logHandler('Episode ' + event.target.result.uri + ' readed from database', 'debug');
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
                            logHandler(event.target.error.name + ' while reading episode "' + episodeUri + '" from IndexedDB (' + event.target.error.message + ')', 'error');
                        };
                    };
                    requestOpenDB.onerror = function (event) {
                        logHandler(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
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
                request.onblocked = function () { logHandler("Database blocked", 'debug'); };
                request.onsuccess = function () {
                    logHandler("Success creating/accessing IndexedDB database", 'debug');
                    var db, transaction, store, cursorRequest, playlist = [];
                    db = this.result;
                    transaction = db.transaction([POD.storage.indexedDbStorage.settings.episodesStore], 'readonly');
                    store = transaction.objectStore(POD.storage.indexedDbStorage.settings.episodesStore);
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
                                playlist.sort(POD.sortEpisodes);
                                onReadCallback(playlist);
                            }
                        }
                    };
                    request.onerror = function (event) {
                        logHandler(event.target.error.name + ' while reading playlist from IndexedDB (' + event.target.error.message + ')', 'error');
                    };
                };
                request.onerror = function (event) {
                    logHandler(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
                };
            },
            writeEpisode: function (episode, onWriteCallback) {
                "use strict";
                var requestOpenDB;
                requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
                requestOpenDB.onupgradeneeded = this.updateIndexedDB;
                requestOpenDB.onblocked = function () {
                    logHandler("Database blocked", 'debug');
                };
                requestOpenDB.onsuccess = function () {
                    logHandler("Success creating/accessing IndexedDB database", 'debug');
                    var db, transaction, store, request;
                    db = this.result;
                    transaction = db.transaction([POD.storage.indexedDbStorage.settings.episodesStore], 'readwrite');
                    store = transaction.objectStore(POD.storage.indexedDbStorage.settings.episodesStore);
                    request = store.put(episode);
                    // Erfolgs-Event
                    request.onsuccess = function (event) {
                        logHandler('Episode ' + event.target.result + ' saved', 'info');
                        if (onWriteCallback && typeof onWriteCallback === 'function') {
                            onWriteCallback(episode);
                        }
                    };
                    request.onerror = function (event) {
                        logHandler(event.target.error.name + ' while saving episode "' + episode.uri + '" to IndexedDB (' + event.target.error.message + ')', 'error');
                    };
                };
                requestOpenDB.onerror = function (event) {
                    logHandler(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
                };
            },
            //File Storage
            saveFile: function (episode, arraybuffer, mimeType, onWriteCallback, onProgressCallback) {
                "use strict";
                logHandler('Saving file "' + episode.mediaUrl + '" to IndexedDB starts now', 'debug');
                var blob, requestOpenDB;
                blob = new Blob([arraybuffer], {type: mimeType});
                requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
                requestOpenDB.onupgradeneeded = this.updateIndexedDB;
                requestOpenDB.onblocked = function () {
                    logHandler("Database blocked", 'debug');
                };
                requestOpenDB.onsuccess = function () {
                    logHandler("Success creating/accessing IndexedDB database", 'debug');
                    var db, transaction, store, request;
                    db = this.result;
                    transaction = db.transaction([POD.storage.indexedDbStorage.settings.filesStore], 'readwrite');
                    store = transaction.objectStore(POD.storage.indexedDbStorage.settings.filesStore);
                    request = store.put(blob, episode.mediaUrl);
                    // Erfolgs-Event
                    request.onsuccess = function () {
                        episode.isFileSavedOffline = true;
                        episode.FileMimeType = mimeType;
                        POD.storage.writeEpisode(episode);
                        logHandler('Saving file "' + episode.mediaUrl + '" to IndexedDB finished', 'info');
                        if (onWriteCallback && typeof onWriteCallback === 'function') {
                            onWriteCallback(episode);
                        }
                    };
                    request.onerror = function (event) {
                        logHandler(event.target.error.name + ' while saving file "' + episode.mediaUrl + '" to IndexedDB (' + event.target.error.message + ')', 'error');
                    };
                };
                requestOpenDB.onerror = function (event) {
                    logHandler(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
                };
            },
            deleteFile: function (episode, onDeleteCallback) {
                "use strict";
                var requestOpenDB;
                window.URL.revokeObjectURL(episode.offlineMediaUrl);
                requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
                requestOpenDB.onupgradeneeded = this.updateIndexedDB;
                requestOpenDB.onblocked = function () {
                    logHandler("Database blocked", 'debug');
                };
                requestOpenDB.onsuccess = function () {
                    logHandler("Success creating/accessing IndexedDB database", 'debug');
                    var db, transaction, store, request;
                    db = this.result;
                    transaction = db.transaction([POD.storage.indexedDbStorage.settings.filesStore], 'readwrite');
                    store = transaction.objectStore(POD.storage.indexedDbStorage.settings.filesStore);
                    request = store.delete(episode.mediaUrl);
                    // Erfolgs-Event
                    request.onsuccess = function () {
                        episode.isFileSavedOffline = false;
                        episode.offlineMediaUrl = undefined;
                        POD.storage.writeEpisode(episode);
                        logHandler('Deleting file "' + episode.mediaUrl + '" from IndexedDB finished', 'info');
                        if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                            onDeleteCallback(episode);
                        }
                    };
                    request.onerror = function (event) {
                        logHandler(event.target.error.name + ' while deleting file "' + episode.mediaUrl + '" from IndexedDB (' + event.target.error.message + ')', 'error');
                    };
                };
                requestOpenDB.onerror = function (event) {
                    logHandler(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
                };
            },
            openFile: function (episode, onReadCallback) {
                "use strict";
                if (episode.isFileSavedOffline) {
                    logHandler('Opening file "' + episode.mediaUrl + '" from IndexedDB starts now', 'debug');
                    var requestOpenDB;
                    requestOpenDB = window.indexedDB.open(this.settings.name, this.settings.version);
                    requestOpenDB.onupgradeneeded = this.updateIndexedDB;
                    requestOpenDB.onblocked = function () {
                        logHandler("Database blocked", 'debug');
                    };
                    requestOpenDB.onsuccess = function () {
                        logHandler("Success creating/accessing IndexedDB database", 'debug');
                        var db, transaction, store, request;
                        db = this.result;
                        transaction = db.transaction([POD.storage.indexedDbStorage.settings.filesStore], 'readonly');
                        store = transaction.objectStore(POD.storage.indexedDbStorage.settings.filesStore);
                        request = store.get(episode.mediaUrl);
                        // Erfolgs-Event
                        request.onsuccess = function (event) {
                            var objectUrl, blob;
                            //blob = new Blob([event.target.result], {type: episode.FileMimeType});
                            blob = event.target.result;
                            objectUrl = window.URL.createObjectURL(blob);
                            episode.offlineMediaUrl = objectUrl;
                            if (onReadCallback && typeof onReadCallback === 'function') {
                                onReadCallback(episode);
                            }
                        };
                        request.onerror = function (event) {
                            logHandler(event.target.error.name + ' while opening file "' + episode.mediaUrl + '" from IndexedDB (' + event.target.error.message + ')', 'error');
                        };
                    };
                    requestOpenDB.onerror = function (event) {
                        logHandler(event.target.error.name + " creating/accessing IndexedDB database (" + event.target.error.message + ")", 'error');
                    };
                } else {
                    if (onReadCallback && typeof onReadCallback === 'function') {
                        onReadCallback(episode);
                    }
                }
            }
        },//end IndexedDbStorage
        fileSystemStorage: {
            settings: {
                fileSystemSize: 1024 * 1024 * 500, /*500 MB */
                fileSystemStatus: window.PERSISTENT
            },
            saveFile: function (episode, arraybuffer, mimeType, onWriteCallback, onProgressCallback) {
                "use strict";
                logHandler('Saving file "' + episode.mediaUrl + '" to local file system starts now', 'debug');
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
                                POD.storage.writeEpisode(episode);
                                logHandler('Saving file "' + episode.mediaUrl + '" to local file system finished', 'info');
                                if (onWriteCallback && typeof onWriteCallback === 'function') {
                                    onWriteCallback(episode);
                                }
                            };
                            writer.onerror = function (event) {
                                logHandler('Error on saving file "' + episode.mediaUrl + '" to local file system (' + event + ')', 'error');
                            };
                            writer.write(blob);
                        }, errorHandler);
                    }, errorHandler);
                }, errorHandler);
            },
            deleteFile: function (episode, onDeleteCallback) {
                "use strict";
                window.resolveLocalFileSystemURL(episode.offlineMediaUrl, function (fileEntry) { //success
                    fileEntry.remove(function () { //success
                        var url;
                        url = episode.offlineMediaUrl;
                        episode.isFileSavedOffline = false;
                        episode.offlineMediaUrl = undefined;
                        POD.storage.writeEpisode(episode);
                        logHandler('Deleting file "' + url + '" finished', 'info');
                        if (onDeleteCallback && typeof onDeleteCallback === 'function') {
                            onDeleteCallback(episode);
                        }
                    }, errorHandler);
                }, function (event) { //error
                    if (event.code === event.NOT_FOUND_ERR) {
                        var url;
                        url = episode.offlineMediaUrl;
                        episode.offlineMediaUrl = undefined;
                        POD.storage.writeEpisode(episode);
                        logHandler('File "' + url + '"not found. But that\'s OK', 'info');
                    } else {
                        errorHandler(event);
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
                        logHandler('You gain access to ' + grantedBytes / 1024 / 1024 + ' MiB of memory', 'debug');
                        navigator.persistentStorage.queryUsageAndQuota(function (usage, quota) {
                            localStorage.setItem("configuration.quota", quota);
                            var availableSpace = quota - usage;
                            $('#memorySizeInput').val(quota / 1024 / 1024).attr('min', Math.ceil(usage / 1024 / 1024)).css('background', 'linear-gradient( 90deg, rgba(0,100,0,0.45) ' + Math.ceil((usage / quota) * 100) + '%, transparent ' + Math.ceil((usage / quota) * 100) + '%, transparent )');
                            if (availableSpace <= (1024 * 1024 * 50)) {
                                logHandler('You are out of space! Please allow more then ' + Math.ceil(quota / 1024 / 1024) + ' MiB of space', 'warning');
                            } else {
                                logHandler('There is ' + Math.floor(availableSpace / 1024 / 1024) + ' MiB of ' + Math.floor(quota / 1024 / 1024) + ' MiB memory available', 'info');
                            }
                        }, errorHandler);
                    }, errorHandler);
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
                playlist.sort(POD.sortEpisodes);

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
                this.dataStorageEngine().deleteSources(source, onDeleteCallback);
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
                logHandler("Missing persistent data storage", "error");
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
                logHandler("Missing persistent file storage", "error");
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
                    newStorageEngine.writeSource(sourcesList[i], POD.web.downloadSource);
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
            var successfunction, errorfunction, parserresult;
            parserresult = {'source': source, 'episodes': []};
            successfunction = function (data) {
                var newestEpisodes, mergeFunction, i;
                logHandler('Download of source "' + source.uri + '" is finished', 'debug');
                mergeFunction = function (mergeEpisode) {
                    POD.storage.readEpisode(mergeEpisode.uri, function (existingEpisode) {
                        existingEpisode.title = mergeEpisode.title;
                        existingEpisode.updated = mergeEpisode.updated;
                        existingEpisode.mediaUrl = mergeEpisode.mediaUrl;
                        existingEpisode.source = mergeEpisode.source;
                        //ATTENTION! never change playback information if episode updated from internet
                        POD.storage.writeEpisode(existingEpisode);
                    });
                };
                parserresult = POD.parser.parseSource(data, source);
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
                POD.storage.writeSource(source);
            };
            errorfunction = function () {
                if (localStorage.getItem("configuration.proxyUrl")) {
                    logHandler('Direct download failed. Try proxy: ' + localStorage.getItem("configuration.proxyUrl").replace("$url$", source.uri), 'warning');
                    $.ajax({
                        'url': localStorage.getItem("configuration.proxyUrl").replace("$url$", source.uri),
                        'async': true,
                        'dataType': 'xml',
                        'success': successfunction,
                        'error': function (jqXHR, textStatus, errorThrown) {
                            logHandler("Download failed: " + textStatus + " (" + errorThrown + ")");
                        }
                    });
                }
            };
            //Load Feed and Parse Entries
            try {
                $.ajax({
                    'url': source.uri,
                    'async': true,
                    'dataType': 'xml',
                    'beforeSend': function (jqXHR, settings) { jqXHR.requestURL = settings.url; },
                    'success': successfunction,
                    'error': errorfunction
                });
            } catch (ignore) {}
        },
        downloadFile: function (episode, mimeType, onDownloadCallback, onProgressCallback) {
            "use strict";
            var xhr = new XMLHttpRequest();
            xhr.open('GET', episode.mediaUrl, true);
            xhr.responseType = 'arraybuffer';
            xhr.timeout = POD.web.settings.downloadTimeout;
            xhr.addEventListener("progress", function (event) {
                if (onProgressCallback && typeof onProgressCallback === 'function') {
                    onProgressCallback(event, 'Download', episode);
                }
            }, false);
            xhr.addEventListener("abort", logHandler, false);
            xhr.addEventListener("error", function () {
                logHandler('Direct download failed. Try proxy: ' + localStorage.getItem("configuration.proxyUrl").replace("$url$", episode.mediaUrl), 'warning');
                var xhrProxy = new XMLHttpRequest();
                xhrProxy.open('GET', localStorage.getItem("configuration.proxyUrl").replace("$url$", episode.mediaUrl), true);
                xhrProxy.responseType = 'arraybuffer';
                xhrProxy.timeout = POD.web.settings.downloadTimeout;
                xhrProxy.addEventListener("progress", function (event) {
                    if (onProgressCallback && typeof onProgressCallback === 'function') {
                        onProgressCallback(event, 'Download', episode);
                    }
                }, false);
                xhrProxy.addEventListener("abort", logHandler, false);
                xhrProxy.addEventListener("error", errorHandler, false);
                xhrProxy.onload = function () {
                    if (this.status === 200) {
                        logHandler('Download of file "' + episode.mediaUrl + '" via proxy is finished', 'debug');
                        POD.storage.saveFile(episode, xhrProxy.response, mimeType, onDownloadCallback);
                    } else {
                        logHandler('Error Downloading file "' + episode.mediaUrl + '" via proxy: ' + this.statusText + ' (' + this.status + ')', 'error');
                    }
                };
                xhrProxy.ontimeout = function () {
                    logHandler("Timeout after " + (xhrProxy.timeout / 60000) + " minutes.", "error");
                };
                xhrProxy.send(null);
            }, false);
            xhr.onload = function () {
                if (this.status === 200) {
                    logHandler('Download of file "' + episode.mediaUrl + '" is finished', 'debug');
                    POD.storage.saveFile(episode, xhr.response, mimeType, onDownloadCallback, onProgressCallback);
                } else {
                    logHandler('Error Downloading file "' + episode.mediaUrl + '": ' + this.statusText + ' (' + this.status + ')', 'error');
                }
            };
            xhr.ontimeout = function () {
                logHandler("Timeout after " + (xhr.timeout / 60000) + " minutes.", "error");
            };
            xhr.send(null);
        }
    },
    parser: {
        parseSource: function (xml, source) {
            "use strict";
            var episodes = [];
            logHandler('Parsing source file "' + source.uri + '" starts now', 'debug');
            //RSS-Feed
            if ($(xml).has('rss[version="2.0"]')) {
                //RSS-Channel
                source.link = $(xml).find('channel > link').text();
                source.title = $(xml).find('channel > title').text();
                source.description = $(xml).find('channel > description').text();
                //RSS-Entries
                $(xml).find('item').each(function () {
                    var item, episode;
                    item = $(this);
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
                    } else if ($(item.find('encoded').text()).find('a[href$=".mp3"]').length > 0) {
                        episode.mediaUrl = $(item.find('encoded').text()).find('a[href$=".mp3"]').first().attr('href');
                    }
                    episodes.push(episode);
                    /*POD.storage.readEpisode(item.find('link, guid').first().text(), function (episode) {
                        if (episode) {
                            episode.title = item.find('title:first').text();
                            if (/^\d/.test(item.find('pubDate:first').text())) {
                                episode.updated = new Date("Sun " + item.find('pubDate:first').text());
                            } else {
                                episode.updated = new Date(item.find('pubDate:first').text());
                            }
                            episode.source = source.title;
                            if (item.find('enclosure').length > 0) {
                                episode.mediaUrl = item.find('enclosure:first').attr('url');
                            } else if ($(item.find('encoded').text()).find('a[href$=".mp3"]').length > 0) {
                                episode.mediaUrl = $(item.find('encoded').text()).find('a[href$=".mp3"]').first().attr('href');
                            }
                            POD.storage.writeEpisode(episode);
                            //tracks.push(episode);
                        } else {
                            logHandler('Can\'t find episode url in datasource', 'error');
                        }
                    });*/
                });
                episodes.sort(POD.sortEpisodes);
            }
            logHandler('Parsing source file "' + source.uri + '" finished', 'info');
            return {'source': source, 'episodes': episodes};
        }
    },
    toggleEpisodeStatus: function (episode) {
        "use strict";
        episode.playback.played = !episode.playback.played;
        episode.playback.currentTime = 0;
        POD.storage.deleteFile(episode);
        POD.storage.writeEpisode(episode);
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
    }
};
var UI =  {
    findEpisodeUI: function (episode) {
        "use strict";
        var episodeUI;
        $('#playlist .entries li').each(function () {
            if ($(this).data('episodeUri') === episode.uri) {
                episodeUI = this;
                return false;
            }
        });
        return episodeUI;
    },
    actualiseEpisodeUI: function (episode) {
        "use strict";
        var episodeUI;
        episodeUI = UI.findEpisodeUI(episode);
        // Status
        if (episode.playback.played) {
            $(episodeUI).find('.status').text("Status: played");
        } else {
            $(episodeUI).find('.status').text("Status: new");
        }
        // Download/Delete link
        if (episode.offlineMediaUrl) {
            $(episodeUI).find('.download').replaceWith('<a class="delete" href="' + episode.offlineMediaUrl + '">Delete</a>');
        } else {
            $(episodeUI).find('.delete').replaceWith('<a class="download" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf()) + '">Download</a>');
        }
        $(episodeUI).find('progress').remove();
        return false;
    },
    renderConfiguration: function () {
        "use strict";
        if (localStorage.getItem("configuration.proxyUrl")) {
            $('#httpProxyInput').val(localStorage.getItem("configuration.proxyUrl"));
        }
    },
    renderEpisode: function (episode) {
        "use strict";
        var entryUI, entryFunctionsUI;
        entryUI = $('<li>');
        entryUI.data('episodeUri', episode.uri);
        entryUI.append('<h3 class="title"><a href="' + episode.uri + '">' + episode.title + '</a></h3>');
        entryUI.append('<span class="source">' + episode.source + '</span>');
        entryUI.append('<time datetime="' + episode.updated.toISOString() + '" class="updated">' + episode.updated.toLocaleDateString() + " " + episode.updated.toLocaleTimeString() + '</span>');
        entryFunctionsUI = $('<span class="functions">');
        if (episode.playback.played) {
            entryFunctionsUI.append('<button type="button" class="status">Status: played</button>');
        } else {
            entryFunctionsUI.append('<button type="button" class="status">Status: new</button>');
        }
        entryFunctionsUI.append('<a class="origin button" href="' + episode.uri + '">Internet</a>');
        if (POD.storage.isFileStorageAvailable()) {
            if (episode.isFileSavedOffline) {
                entryFunctionsUI.append('<button type="button" class="delete" href="' + episode.mediaUrl + '">Delete</button>');
            } else if (episode.mediaUrl) {
                entryFunctionsUI.append('<a class="button downloadFile" href="' + episode.mediaUrl + '" download="' + episode.mediaUrl.slice(episode.mediaUrl.lastIndexOf()) + '">Download</a>');
            }
        }
        entryUI.append(entryFunctionsUI);
        return entryUI;
    },
    renderPlaylist: function (playlist) {
        "use strict";
        var playlistUI, entryUI, i;
        playlistUI = $('#playlist .entries');
        playlistUI.empty();
        if (playlist && playlist.length > 0) {
            for (i = 0; i < playlist.length; i++) {
                entryUI = UI.renderEpisode(playlist[i]);
                playlistUI.append(entryUI);
            }
        } else {
            entryUI = $('<li>no entries</li>');
            playlistUI.append(entryUI);
        }
    },
    renderSource: function (source) {
        "use strict";
        var entryUI, entryFunctionsUI;
        entryUI = $('<li>');
        entryUI.data('sourceUri', source.uri);
        entryUI.append('<h3 class="title">' + source.title + '<h3>');
        entryUI.append('<p class="description">' + source.description + '</p>');
        entryUI.append('<p class="uri"><a href="' + source.uri + '">' + source.uri + '</a></p>');
        entryFunctionsUI = $('<span class="functions">');
        entryFunctionsUI.append('<a class="link button" href="' + source.link + '">Internet</a> ');
        entryFunctionsUI.append('<button type="button" class="updateSource" href="' + source.uri + '">Update</button> ');
        entryFunctionsUI.append('<button type="button" class="deleteSource" href="' + source.uri + '">Delete</button>');
        entryUI.append(entryFunctionsUI);
        return entryUI;
    },
    renderSourceList: function (sourcelist) {
        "use strict";
        var sourcelistUI, entryUI, i;
        sourcelistUI = $('#sources .entries');
        sourcelistUI.empty();
        if (sourcelist && sourcelist.length > 0) {
            for (i = 0; i < sourcelist.length; i++) {
                entryUI = this.renderSource(sourcelist[i]);
                sourcelistUI.append(entryUI);
            }
        } else {
            entryUI = $('<li>no entries</li>');
            sourcelistUI.append(entryUI);
        }
    },
    activeEpisode: function (onReadCallback) {
        "use strict";
        var activeEpisode = $('#playlist').find('.activeEpisode');
        POD.storage.readEpisode(activeEpisode.data('episodeUri'), onReadCallback);
    },
    previousEpisode: function (onReadCallback) {
        "use strict";
        var activeEpisode = $('#playlist').find('.activeEpisode');
        POD.storage.readEpisode(activeEpisode.prev().data('episodeUri'), onReadCallback);
    },
    nextEpisode: function (onReadCallback) {
        "use strict";
        var activeEpisode = $('#playlist').find('.activeEpisode');
        POD.storage.readEpisode(activeEpisode.next().data('episodeUri'), onReadCallback);
    },
    getLastPlayedEpisode: function (onReadCallback) {
        "use strict";
        var lastPlayedEpisode, i;
        lastPlayedEpisode = $('#playlist li:first-child').data('episodeUri');
        POD.storage.readPlaylist(false, function (playlist) {
            if (playlist && playlist.length > 0) {
                for (i = 0; i < playlist.length; i++) {
                    if (playlist[i].uri === localStorage.getItem('configuration.lastPlayed')) {
                        lastPlayedEpisode = playlist[i].uri;
                        break;
                    }
                }
            }
            POD.storage.readEpisode(lastPlayedEpisode, onReadCallback);
        });
    },
    progressHandler: function (progressEvent, prefix, episode) {
        "use strict"; //xmlHttpRequestProgressEvent
        var progressbar, percentComplete, episodeUI;
        episodeUI = UI.findEpisodeUI(episode);
        if ($(episodeUI).find('progress').length) {
            progressbar = $(episodeUI).find('progress');
        } else {
            progressbar = $('<progress min="0" max="1">&helip;</progress>');
            $(episodeUI).find('.downloadFile').hide().after(progressbar);
        }
        if (progressEvent.lengthComputable) {
            percentComplete = progressEvent.loaded / progressEvent.total;
            console.log(prefix + ': ' + (percentComplete * 100).toFixed(2) + '%');
            $(episodeUI).find('progress').attr('value', percentComplete).text((percentComplete * 100).toFixed(2) + '%');
        } else {
            console.log(prefix + '...');
            $(episodeUI).find('progress').removeAttr('value').text('&helip;');
        }
    }
};

/** Functions for playback */

var activateEpisode = function (episode, onActivatedCallback) {
    "use strict";
    var mediaUrl, audioTag, mp3SourceTag;
    $('#player audio').off('timeupdate');
    logHandler("Timeupdate off", 'debug');
    if (episode) {
        POD.storage.openFile(episode, function (episode) {
            if (episode.offlineMediaUrl) {
                mediaUrl =  episode.offlineMediaUrl;
            } else {
                mediaUrl = episode.mediaUrl;
            }
            if ($('#player audio').length > 0) {
                audioTag = $('#player audio')[0];
                $(audioTag).find('source[type="audio/mpeg"]').attr('src', mediaUrl);
                $(audioTag).attr('title', episode.title);
            } else {
                $('#mediacontrol > p').remove();
                audioTag = $('<audio controls="controls" preload="metadata">');
                mp3SourceTag = $('<source type="audio/mpeg" />');
                mp3SourceTag.attr('src', mediaUrl);
                audioTag.append(mp3SourceTag);
                audioTag.attr('title', episode.title);
                $('#mediacontrol').prepend(audioTag);
                //Attach player events
                $('#player audio').on('loadstart', function () {
                    logHandler("==============================================", 'debug');
                    UI.activeEpisode(function (episode) { logHandler("Start loading " + episode.title, 'debug'); });
                });
                $('#player audio').on('loadedmetadata', function () {
                    UI.activeEpisode(function (episode) { logHandler("Load metadata of " + episode.title, 'debug'); });
                });
                $('#player audio').on('canplay', function () {
                    UI.activeEpisode(function (episode) { logHandler(episode.title + " is ready to play", 'debug'); });
                });
                $('#player audio').on('canplaythrough', function () {
                    UI.activeEpisode(function (episode) { logHandler(episode.title + " is realy ready to play (\"canplaythrough\")", 'debug'); });
                });
                $('#player audio').on('playing', function (event) {
                    var audioElement = event.target;
                    UI.activeEpisode(function (episode) {
                        logHandler(episode.title + " is playing", 'info');
                        audioElement.autoplay = true;
                    });
                });
                $('#player audio').on('ended', function () {
                    UI.activeEpisode(function (episode) {
                        logHandler(episode.title + " is ended", 'debug');
                        POD.toggleEpisodeStatus(episode);
                        //Plays next Episode in Playlist
                        UI.nextEpisode(playEpisode);
                    });
                });
                $('#player audio, #player audio source').on('error', function (e) {
                    var errormessage, readystate;
                    errormessage = e.toString();
                    readystate = $(this).parent()[0].readyState;
                    if (readystate === 0) {
                        errormessage = "Can't load file";
                    } else if ($(this).parent()[0].error) {
                        switch (e.target.error.code) {
                        case e.target.error.MEDIA_ERR_ABORTED:
                            errormessage = 'You aborted the video playback.';
                            break;
                        case e.target.error.MEDIA_ERR_NETWORK:
                            errormessage = 'A network error caused the audio download to fail.';
                            break;
                        case e.target.error.MEDIA_ERR_DECODE:
                            errormessage = 'The audio playback was aborted due to a corruption problem or because the video used features your browser did not support.';
                            break;
                        case e.target.error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                            errormessage = 'The video audio not be loaded, either because the server or network failed or because the format is not supported.';
                            break;
                        default:
                            errormessage = 'An unknown error occurred.';
                            break;
                        }
                    }
                    logHandler(errormessage, 'error');
                    UI.nextEpisode(playEpisode);
                });
                $('#player audio').on('durationchange', function (event) {
                    var audioElement = event.target;
                    UI.activeEpisode(function (episode) {
                        logHandler("Duration of " + episode.title + " is changed to " + event.currentTarget.duration + ".", 'debug');
                        if (episode && audioElement.duration > episode.playback.currentTime && audioElement.currentTime <= episode.playback.currentTime) {
                            logHandler("CurrentTime will set to " + episode.playback.currentTime + " seconds", 'debug');
                            audioElement.currentTime = episode.playback.currentTime;
                            $(audioElement).on('timeupdate', function (event) {
                                if (episode && (event.target.currentTime > (episode.playback.currentTime + 10) || event.target.currentTime < (episode.playback.currentTime - 10))) {
                                    episode.playback.currentTime = Math.floor(event.target.currentTime / 10) * 10;
                                    POD.storage.writeEpisode(episode);
                                    logHandler('Current timecode is ' + episode.playback.currentTime + '.', 'debug');
                                }
                            });
                            logHandler("Timeupdate on", 'debug');
                        }
                    });
                });
            }
            //Styling
            $('#playlist').find('.activeEpisode').removeClass('activeEpisode');
            $('#playlist li').filter(function () { return $(this).data('episodeUri') === episode.uri; }).addClass('activeEpisode');
            if (onActivatedCallback && typeof onActivatedCallback === 'function') {
                onActivatedCallback(episode);
            }
        });
    }
};
var playEpisode = function (episode, onPlaybackStartedCallback) {
    "use strict";
    if (episode) {
        activateEpisode(episode, function (episode) {
            localStorage.setItem('configuration.lastPlayed', episode.uri);
            $('#player audio')[0].load();
            if (onPlaybackStartedCallback && typeof onPlaybackStartedCallback === 'function') {
                onPlaybackStartedCallback(episode);
            }
        });
    }
};

/** Central 'ready' event handler */
$(document).ready(function () {
    "use strict";
    //Update local storage to actual version of key-names (changed "track" to "episode")
    var k, quota, multiMediaKeyDownTimestemp;
    for (k = 0; k < localStorage.length; k++) {
        if (localStorage.key(k).slice(0, 6) === 'track.') {
            localStorage.setItem(localStorage.key(k).replace('track.', 'episode.'), localStorage.getItem(localStorage.key(k)));
            localStorage.removeItem(localStorage.key(k));
        }
    }
    //Application Cache Events
    $(applicationCache).on('checking', function () {
        logHandler("Application cache checks for updates (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache check for updates" + '</span></br>');
    });
    $(applicationCache).on('noupdate', function () {
        logHandler("Application cache founds no update (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache founds no update" + '</span></br>');
    });
    $(applicationCache).on('downloading', function () {
        logHandler("Application cache download updated files (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache download updated files" + '</span></br>');
    });
    $(applicationCache).on('progress', function () {
        logHandler("Application cache downloading files (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache downloading files" + '</span></br>');
    });
    $(applicationCache).on('cached', function () {
        logHandler("Application cached (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cached" + '</span></br>');
    });
    $(applicationCache).on('updateready', function () {
        logHandler("Application cache is updated (Cache status: " + applicationCache.status + ")", 'info');
        $('#applicationCacheLog').prepend('<span>' + "Application cache is updated" + '</span></br>');
        applicationCache.swapCache();
        alert("An update of HTML5 Podcatcher is available. Please reload to activate the new Version.");
    });
    $(applicationCache).on('obsolete', function () {
        logHandler("Application cache is corrupted and will be deletet (Cache status: " + applicationCache.status + ")", 'debug');
        $('#applicationCacheLog').prepend('<span>' + "Application cache is corrupted and will be deletet" + '</span></br>');
    });
    $(applicationCache).on('error', function () {
        logHandler("Error downloading manifest or resources (Cache status: " + applicationCache.status + ")", 'error');
        $('#applicationCacheLog').prepend('<span>' + "Error downloading manifest or resources" + '</span></br>');
    });
    //Player UI Events
    $('#player #playPreviousEpisode').on('click', function () {
        UI.previousEpisode(playEpisode);
    });
    $('#player #playNextEpisode').on('click', function () {
        UI.nextEpisode(playEpisode);
    });
    $('#player #jumpBackwards').on('click', function () {
        var audioTag = $('#player audio')[0];
        audioTag.currentTime = Math.max(0, audioTag.currentTime - 10);
    });
    $('#player #jumpForwards').on('click', function () {
        var audioTag = $('#player audio')[0];
        audioTag.currentTime = Math.min(audioTag.duration, audioTag.currentTime + 10);
    });
    $(document).on('keydown', function (event) {
        if (event.key === 'MediaNextTrack' || event.keyCode === 176) {
            var now = new Date();
            if (!multiMediaKeyDownTimestemp) {
                multiMediaKeyDownTimestemp = new Date();
            } else if (now - multiMediaKeyDownTimestemp >= 1000) {
                if ($('#player audio').length && $('#player audio')[0].playbackRate === 1) {
                    $('#player audio')[0].playbackRate = 2;
                }
            }
        }
    });
    $(document).on('keyup', function (event) {
        if (event.key === 'MediaNextTrack' || event.keyCode === 176) {
            var now = new Date();
            if (now - multiMediaKeyDownTimestemp < 1000) {
                UI.nextEpisode(playEpisode);
            } else {
                if ($('#player audio').length && $('#player audio')[0].playbackRate !== 1) {
                    $('#player audio')[0].playbackRate = 1;
                }
            }
        } else if (event.key === 'MediaPreviousTrack' || event.keyCode === 177) {
            if ($('#player audio').length && $('#player audio')[0].currentTime >= 10) {
                $('#player audio')[0].currentTime = 0;
            } else {
                UI.previousEpisode(playEpisode);
            }
        } else if (event.key === 'MediaPlayPause' || event.key === 'MediaPlay' || event.keyCode === 179) {
            if ($('#player audio').length) {
                if ($('#player audio')[0].paused) {
                    $('#player audio')[0].play();
                } else {
                    $('#player audio')[0].pause();
                }
            }
        } else if (event.key === 'MediaStop' || event.keyCode === 178) {
            if ($('#player audio').length) {
                $('#player audio')[0].pause();
            }
        }
        multiMediaKeyDownTimestemp = undefined;
    });
    //Playlist UI Events
    $('#playlist').on('click', 'li', function (event) {
        event.preventDefault();
        event.stopPropagation();
        //Play episode
        //$('#player audio')[0].autoplay = true;
        POD.storage.readEpisode($(this).data('episodeUri'), playEpisode);
    });
    $('#playlist').on('click', '.downloadFile', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var episodeUI;
        episodeUI = $(this).closest('li');
        POD.storage.readEpisode(episodeUI.data('episodeUri'), function (episode) {
            logHandler('Downloading file "' + episode.mediaUrl + '" starts now.', 'info');
            POD.web.downloadFile(episode, 'audio/mpeg', function (episode) {
                episodeUI.replaceWith(UI.renderEpisode(episode));
            }, UI.progressHandler);
        });
    });
    $('#playlist').on('click', '.delete', function (event) {
        event.preventDefault();
        event.stopPropagation();
        POD.storage.readEpisode($(this).closest('li').data('episodeUri'), function (episode) {
            logHandler('Deleting file "' + episode.offlineMediaUrl + '" starts now', 'info');
            POD.storage.deleteFile(episode);
        });
    });
    $('#playlist').on('click', '.status', function (event) {
        event.preventDefault();
        event.stopPropagation();
        POD.storage.readEpisode($(this).closest('li').data('episodeUri'), function (episode) {
            POD.toggleEpisodeStatus(episode);
        });
    });
    $('#playlist').on('click', '.origin', function (event) {
        event.stopPropagation();
        event.preventDefault();
        window.open($(this).attr('href'), '_blank');
    });
    $('#playlist #updatePlaylist').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var i;
        POD.storage.readSources(function (sources) {
            for (i = 0; i < sources.length; i++) {
                POD.web.downloadSource(sources[i]);
            }
        });
    });
    $('#playlist #showFullPlaylist').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        POD.storage.readPlaylist(true, UI.renderPlaylist);
    });
    document.addEventListener('writeEpisode', function (event) {
        var i, episode, episodeUI;
        episode = event.detail.episode;
        episodeUI = UI.renderEpisode(episode);
        //find episode in HTML markup
        for (i = 0; i < $('#playlist').find('.entries li').length; i++) {
            if ($($('#playlist').find('.entries li')[i]).data('episodeUri') === episode.uri) {
                //Actualise episodes markup
                $($('#playlist').find('.entries li')[i]).html(episodeUI.html());
                return;
            }
        }
        //show unlisend episode if not listed before
        if (!episode.playback.played) {
            episodeUI.hide();
            $('#playlist').find('.entries').append(episodeUI);
            episodeUI.fadeIn();
        }
    }, false);
    //Sources UI Events
    $('#sources').on('click', '.updateSource', function (event) {
        event.preventDefault();
        event.stopPropagation();
        POD.storage.readSource($(this).attr("href"), function (source) {
            POD.web.downloadSource(source);
        });
    });
    $('#sources').on('click', '.deleteSource', function (event) {
        event.preventDefault();
        event.stopPropagation();
        var i, removeFunction;
        removeFunction = function (element) { $(element).remove(); };
        POD.storage.readSource($(this).closest('li').data('sourceUri'), function (source) {
            POD.storage.deleteSource(source, function (source) {
                for (i = 0; i < $('#sources .entries li').length; i++) {
                    if ($($('#sources .entries li')[i]).data('sourceUri') === source.uri) {
                        $($('#sources .entries li')[i]).slideUp(400, removeFunction(this));
                        break;
                    }
                }
            });
        });
    });
    $('#sources').on('click', '.link', function (event) {
        event.preventDefault();
        event.stopPropagation();
        window.open($(this).attr('href'), '_blank');
    });
    $('#sources #addSourceForm').on('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#addSourceUrlInput')[0].checkValidity()) {
            POD.storage.readSource($('#addSourceUrlInput').val(), function (source) {
                POD.web.downloadSource(source);
            });
        }
    });
    document.addEventListener('writeSource', function (event) {
        var i, source, sourceUI;
        source = event.detail.source;
        sourceUI = UI.renderSource(source);
        for (i = 0; i < $('#sources').find('.entries li').length; i++) {
            if ($($('#sources').find('.entries li')[i]).data('sourceUri') === source.uri) {
                $($('#sources').find('.entries li')[i]).slideUp().html(sourceUI.html()).slideDown();
                return;
            }
        }
        //show source if not listed before
        sourceUI.hide();
        $('#sources').find('.entries').append(sourceUI);
        sourceUI.fadeIn();
    }, false);
    //Configuration UI Events
    $('#configuration #memorySizeForm').on('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#memorySizeInput')[0].checkValidity()) {
            POD.storage.fileSystemStorage.requestFileSystemQuota($('#memorySizeInput').val() * 1024 * 1024);
        } else {
            logHandler('Please insert a number', 'error');
        }
    });
    $('#configuration #proxyForm').on('submit', function (event) {
        event.preventDefault();
        event.stopPropagation();
        if ($('#httpProxyInput')[0].checkValidity()) {
            localStorage.setItem("configuration.proxyUrl", $('#httpProxyInput').val());
        } else {
            logHandler('Please insert a URL', 'error');
        }
    });
    $('#configuration #exportConfiguration').on('click', function () {
        var i, key, config;
        config = {'Episodes': {}, 'Sources': {}, 'Settings': {}};
        for (i = 0; i < localStorage.length; i++) {
            key = localStorage.key(i);
            if (key.slice(0, 7) === 'source.') {
                config.Sources[key] = localStorage.getItem(key);
            } else if (localStorage.key(i).slice(0, 8) === 'episode.') {
                config.Episodes[key] = localStorage.getItem(key);
            } else {
                config.Settings[key] = localStorage.getItem(key);
            }
        }
        $(this).parent().find('#SerialisedConfigurationInput').val(JSON.stringify(config));
        $(this).parent().find('#SerialisedConfigurationInput')[0].select();
    });
    $('#configuration #importConfiguration').on('click', function () {
        var config, property;
        localStorage.clear();
        config = JSON.parse($(this).parent().find('#SerialisedConfigurationInput').val());
        for (property in config.Episodes) {
            if (config.Episodes.hasOwnProperty(property)) {
                localStorage.setItem(property, config.Episodes[property]);
            }
        }
        for (property in config.Sources) {
            if (config.Sources.hasOwnProperty(property)) {
                localStorage.setItem(property, config.Sources[property]);
            }
        }
        for (property in config.Settings) {
            if (config.Settings.hasOwnProperty(property)) {
                localStorage.setItem(property, config.Settings[property]);
            }
        }
    });
    $('#statusbar').on('click', function (event) {
        event.preventDefault();
        event.stopPropagation();
        $(this).parent().toggleClass('fullscreen');
    });
    window.addEventListener('online',  function () {
        logHandler("Online now", 'info');
        $('#updatePlaylist, .updateSource, .downloadFile').removeAttr('disabled');
    }, false);
    window.addEventListener('offline', function () {
        logHandler("Offline now", 'info');
        $('#updatePlaylist, .updateSource, .downloadFile').attr('disabled', 'disabled');
    }, false);
    //Quota and Filesystem initialisation
    if (POD.storage.fileStorageEngine() === POD.storage.fileSystemStorage) {
        $('#memorySizeForm').show();
        quota = localStorage.getItem("configuration.quota");
        if (!quota) { quota = 1024 * 1024 * 200; }
        POD.storage.fileSystemStorage.requestFileSystemQuota(quota);
    } else {
        $('#memorySizeForm').hide();
    }
    //Render lists and settings
    UI.renderConfiguration();
    POD.storage.readSources(function (sources) {
        UI.renderSourceList(sources);
        POD.storage.readPlaylist(false, UI.renderPlaylist);
        if (!navigator.onLine) {
            $('#updatePlaylist, .updateSource, .downloadFile').attr('disabled', 'disabled');
        }
        //Initialise player
        UI.getLastPlayedEpisode(playEpisode);
    });
});