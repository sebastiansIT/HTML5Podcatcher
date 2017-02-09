/** @module  HTML5Podcatcher/Storage/FileStorageProvider
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @license Copyright 2015, 2016 Sebastian Spautz

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

/*global define */

define([], function () {
    "use strict";

    var IFileStorageProvider;

    // ====================================== //
    // === Interface IFileStorageProvider === //
    // ====================================== //
    /** Interface defining methods to access a storage for files (BLOBs).
      * @interface
      */
    IFileStorageProvider = function () {
        this.isSupportedByCurrentPlatform = false;
        this.priority = 0;
    };
    IFileStorageProvider.prototype.openFile = function (/*episode, onReadCallback*/) {
        throw new Error('not implemented');
    };
    IFileStorageProvider.prototype.saveFile = function (/*episode, content, onWriteCallback, onProgressCallback*/) {
        throw new Error('not implemented');
    };

    /** Delete all media files associated with the given episode from the storage.
     * @param {Episode} episode - The episode whose files should deleted from the storage.
     * @param {DeletedFileCallback} [onDeleteCallback] - The function that is called when deleting is finished.
     */
    IFileStorageProvider.prototype.deleteFile = function (/*episode, onDeleteCallback*/) {
        throw new Error('not implemented');
    };

    IFileStorageProvider.prototype.listFiles = function (/*onReadCallback*/) {
        throw new Error('not implemented');
    };
    // === General storage functions
    IFileStorageProvider.prototype.init = function (parameters) {
        //TODO HTML5Podcatcher.logger('Init abstract file storage provider with' + parameters, 'debug');
    };

    /** Delete all content from the file storage.
     * @param {CleandStorageCallback} onCleanupCallback - The function that is called when all data from file storage is deletet.
     */
    IFileStorageProvider.prototype.cleanStorage = function (/*onCleanupCallback*/) {
        throw new Error('not implemented');
    };

    return IFileStorageProvider;
});
