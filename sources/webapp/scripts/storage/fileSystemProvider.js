/*  Copyright 2013 - 2015 Sebastian Spautz

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
/*global window, navigator, Blob */
/*global HTML5Podcatcher */
HTML5Podcatcher.storage.fileSystemStorage = {
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
        if (episode.offlineMediaUrl) {
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
        }
    },
    openFile: function (episode, onReadCallback) {
        "use strict";
        if (onReadCallback && typeof onReadCallback === 'function') {
            onReadCallback(episode);
        }
    },
    requestFileSystemQuota: function (quota, onRequestCallback) {
        "use strict";
        if (navigator.persistentStorage) {
            navigator.persistentStorage.requestQuota(quota, function (grantedBytes) {
                HTML5Podcatcher.logger('You gain access to ' + grantedBytes / 1024 / 1024 + ' MiB of memory', 'debug');
                navigator.persistentStorage.queryUsageAndQuota(function (usage, quota) {
                    var availableSpace;
                    availableSpace = quota - usage;
                    if (availableSpace <= (1024 * 1024 * 50)) {
                        HTML5Podcatcher.logger('You are out of space! Please allow more then ' + Math.ceil(quota / 1024 / 1024) + ' MiB of space', 'warning');
                    } else {
                        HTML5Podcatcher.logger('There is ' + Math.floor(availableSpace / 1024 / 1024) + ' MiB of ' + Math.floor(quota / 1024 / 1024) + ' MiB memory available', 'info');
                    }
                    if (onRequestCallback && typeof onRequestCallback === 'function') {
                        onRequestCallback(usage, quota);
                    }
                }, HTML5Podcatcher.errorLogger);
            }, HTML5Podcatcher.errorLogger);
        }
    }
};