/** @module  HTML5Podcatcher/Storage/ChromeFileSystem
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
/*global window, navigator, Blob */
/*global HTML5Podcatcher */

var chromeFileSystemStorageImplementation = (function () {
    "use strict";
    var settings, ChromeFileSystemFileProvider;
    // === Private Felder
    settings = {
        fileSystemStatus: window.PERSISTENT
    };
    // ====================================== //
    // === Implementation of FileProvider === //
    // ====================================== //
    /** Provides access to a file storage implemented with Googles File System API.
    * @class
    * @implements module:HTML5Podcatcher/Storage~IFileProvider
    * @param {(window.TEMPORARY|window.PERSISTENT)} [fileSystemStatus=window.PERSISTENT] - The persistency status of the file system: window.TEMPORARY or window.PERSISTENT.
    */
    ChromeFileSystemFileProvider = function (fileSystemStatus) {
        var fsStatus = fileSystemStatus || settings.fileSystemStatus;
        this.fileSystemSize = 1024 * 1024 * 500; /*500 MB */
        this.getFileSystemStatus = function () {
            return fsStatus;
        };
        this.isSupportedByCurrentPlatform = !!window.requestFileSystem;
        this.priority = 200;
    };
    ChromeFileSystemFileProvider.prototype = new HTML5Podcatcher.api.storage.IFileProvider();
    ChromeFileSystemFileProvider.prototype.constructor = ChromeFileSystemFileProvider;
    ChromeFileSystemFileProvider.prototype.toString = function () {
        return "File storage provider based on Google File System API [Persistants Status: " + this.getFileSystemStatus() + "]";
    };
    ChromeFileSystemFileProvider.prototype.init = function (parameters) {
        if (!parameters.quota) {
            parameters.quota = 1024 * 1024 * 200;
        }
        this.requestFileSystemQuota(parameters.quota, function (usage, quota) {
            HTML5Podcatcher.logger("Usage: " + usage + " MiB of " + quota + 'MiB File Storage', 'info');
        });
    };
    // == Access on storage for BLOBs
    ChromeFileSystemFileProvider.prototype.openFile = function (episode, onReadCallback) {
        if (onReadCallback && typeof onReadCallback === 'function') {
            onReadCallback(episode);
        }
    };
    ChromeFileSystemFileProvider.prototype.saveFile = function (episode, arraybuffer, onWriteCallback, onProgressCallback) {
        var mimeType = episode.mediaType || 'audio/mpeg',
            blob = new Blob([arraybuffer], {type: mimeType}),
            parts = episode.mediaUrl.split('/'),
            fileName = parts[parts.length - 1];

        HTML5Podcatcher.logger('Saving file "' + episode.mediaUrl + '" to local file system starts now', 'debug', 'FileSystemAPI');

        // Write file to the root directory.
        window.requestFileSystem(this.getFileSystemStatus(), this.fileSystemSize, function (filesystem) {
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
                        HTML5Podcatcher.api.storage.StorageProvider.writeEpisode(episode);
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
    };
    ChromeFileSystemFileProvider.prototype.deleteFile = function (episode, onDeleteCallback) {
        if (episode.offlineMediaUrl) {
            window.resolveLocalFileSystemURL(episode.offlineMediaUrl, function (fileEntry) { //success
                fileEntry.remove(function () { //success
                    var url;
                    url = episode.offlineMediaUrl;
                    episode.isFileSavedOffline = false;
                    episode.offlineMediaUrl = undefined;
                    HTML5Podcatcher.api.storage.StorageProvider.writeEpisode(episode);
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
                    HTML5Podcatcher.api.storage.StorageProvider.writeEpisode(episode);
                    HTML5Podcatcher.logger('File "' + url + '"not found. But that\'s OK', 'info');
                } else {
                    HTML5Podcatcher.logger(event, 'error');
                }
            });
        }
    };
    ChromeFileSystemFileProvider.prototype.requestFileSystemQuota = function (quota, onRequestCallback) {
        if (navigator.persistentStorage) {
            navigator.persistentStorage.requestQuota(quota, function (grantedBytes) {
                HTML5Podcatcher.logger('You gain access to ' + grantedBytes / 1024 / 1024 + ' MiB of memory', 'debug:FileSystemAPI');
                navigator.persistentStorage.queryUsageAndQuota(function (usage, quota) {
                    var availableSpace;
                    availableSpace = quota - usage;
                    if (availableSpace <= (1024 * 1024 * 50)) {
                        HTML5Podcatcher.logger('You are out of space! Please allow more then ' + Math.ceil(quota / 1024 / 1024) + ' MiB of space', 'warn');
                    } else {
                        HTML5Podcatcher.logger('There is ' + Math.floor(availableSpace / 1024 / 1024) + ' MiB of ' + Math.floor(quota / 1024 / 1024) + ' MiB memory available', 'info');
                    }
                    if (onRequestCallback && typeof onRequestCallback === 'function') {
                        onRequestCallback(usage, quota);
                    }
                }, HTML5Podcatcher.errorLogger);
            }, HTML5Podcatcher.errorLogger);
        }
    };
    // ====================================== //
    // === Export public Elements         === //
    // ====================================== //
    return {
        'ChromeFileSystemFileProvider': ChromeFileSystemFileProvider
    };
}());

/** The modul "ChromeFileSystem" is available at document.HTML5Podcatcher.api.storage.chromeFileSystem.
  * @global
  * @name "HTML5Podcatcher.api.storage.ChromeFileSystem"
  * @see module:HTML5Podcatcher/Storage/ChromeFileSystem
  */
HTML5Podcatcher.api.storage.chromeFileSystem = chromeFileSystemStorageImplementation;

HTML5Podcatcher.api.storage.StorageProvider.registerFileProvider(new HTML5Podcatcher.api.storage.chromeFileSystem.ChromeFileSystemFileProvider());