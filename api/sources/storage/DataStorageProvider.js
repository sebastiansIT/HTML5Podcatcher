/** @module  HTML5Podcatcher/Storage/DataStorageProvider
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

    var IDataStorageProvider;

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
    // === Interface IDataStorageProvider === //
    // ====================================== //
    /** Interface defining methods to access a data storage for sources and episodes.
      * @interface
      */
    IDataStorageProvider = function () {
        this.isSupportedByCurrentPlatform = false;
        this.priority = 0;
    };

    // -------------------------------------- //
    // --- Source storage                 --- //
    // -------------------------------------- //
    /** Read a source, identified by the given URI, from storage.
      * @param {String} sourceUri - The URI of the source-feed you want to read from storage.
      * @param {ReadedSourceCallback} [onReadCallback] - The function that is called when reading is finished.
      */
    IDataStorageProvider.prototype.readSource = function (/*sourceUri, onReadCallback*/) {
        throw new Error('not implemented');
    };

    /** Reads all available sources from storage.
      * @param {ReadedSourcesCallback} [onReadCallback] - The function that is called when reading is finished.
      */
    IDataStorageProvider.prototype.readSources = function (/*onReadCallback*/) {
        throw new Error('not implemented');
    };

    /** Write a source to the storage.
    * @param {Source} source - The source you want to write to the storage.
    * @param {WritenSourceCallback} [onWriteCallback] - The function that is called when writing is finished.
    */
    IDataStorageProvider.prototype.writeSource = function (/*source, onWriteCallback*/) {
        throw new Error('not implemented');
    };

    /** Write an array of sources to the storage.
    * @param {Source[]} source - The sources you want to write to the storage.
    * @param {WritenSourcesCallback} [onWriteCallback] - The function that is called when writing is finished.
    */
    IDataStorageProvider.prototype.writeSources = function (/*sources, onWriteCallback*/) {
        throw new Error('not implemented');
    };

    /** Delete a source from the storage.
    * @param {Source} source - The source you want to delete from the storage.
    * @param {DeletedSourceCallback} [onDeleteCallback] - The function that is called when deleting is finished.
    */
    IDataStorageProvider.prototype.deleteSource = function (/*source, onDeleteCallback*/) {
        throw new Error('not implemented');
    };

    // -------------------------------------- //
    // --- Episode storage                --- //
    // -------------------------------------- //
    /** Read a episode from the storage.
    * @param {string} episodeUri - The URI of the episode you want to read from the storage.
    * @param {ReadedEpisodeCallback} [onReadCallback] - The function that is called when reading is finished.
    */
    IDataStorageProvider.prototype.readEpisode = function (/*episodeUri, onReadCallback*/) {
        throw new Error('not implemented');
    };

    /** Read episodes from the storage. You can either read all episodes or only the new ones.
    * @param {boolean} showAll=false - If true you get all episodes. Otherwise you get only the new one.
    * @param {ReadedEpisodesCallback} [onReadCallback] - The function that is called when reading is finished.
    */
    IDataStorageProvider.prototype.readPlaylist = function (/*showAll, onReadCallback*/) {
        throw new Error('not implemented');
    };

    /** Read episodes from the given podcast/source.
    * @param {Source} source - The source you want.
    * @param {ReadedEpisodesCallback} [onReadCallback] - The function that is called when reading is finished.
    */
    IDataStorageProvider.prototype.readEpisodesBySource = function (/*source, onReadCallback*/) {
        throw new Error('not implemented');
    };

    /** Write a episodes to the storage.
    * @param {Episode} episode - The episode to write to the storage.
    * @param {WritenEpisodeCallback} [onWriteCallback] - The function that is called when writing is finished.
    */
    IDataStorageProvider.prototype.writeEpisode = function (/*episode, onWriteCallback*/) {
        throw new Error('not implemented');
    };

    /** Write an array of episodes to the storage.
    * @param {Episode[]} episodes - The episodes to write to the storage.
    * @param {WritenEpisodesCallback} [onWriteCallback] - The function that is called when writing is finished.
    */
    IDataStorageProvider.prototype.writeEpisodes = function (/*episodes, onWriteCallback*/) {
        throw new Error('not implemented');
    };

    // -------------------------------------- //
    // ---  General storage functions     --- //
    // -------------------------------------- //
    /** Delete all content from the data storage.
     * @param {CleandStorageCallback} onCleanupCallback - The function that is called when all data from data storage is deletet.
     */
    IDataStorageProvider.prototype.cleanStorage = function (/*onCleanupCallback*/) {
        throw new Error('not implemented');
    };

    return IDataStorageProvider;
});
