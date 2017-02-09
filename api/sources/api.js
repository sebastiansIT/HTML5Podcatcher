/*  Copyright 2013 - 2017 Sebastian Spautz

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

/** 
  * Central module with the public functions of the HTML5 Podcatcher API.
  * @module html5podcatcher
  */

import Episode, {STATE_UNLISTEND} from './model/episode';
import StorageProviderFacade from './storage/providerfacade';
  
/** 
  * Array of episodes in the playlist
  * @private
  * @type {module:html5podcatcher/model/episodes~Episode[]}
  */
var playlist = [];
playlist.push(new Episode('http://www.podcast.local/episode1', {title: 'Episode 1', subTitle: 'Summary of Episode 1', source: 'Source 1', playback: {}, updated: new Date()}));
playlist.push(new Episode('http://www.podcast.local/episode2', {title: 'Episode 2', source: 'Source 1', playback: {}, updated: new Date()}));

var storageProvider = new StorageProviderFacade();

export default {
	/**
	  * This namespace contains all public functions to read and manipulate the playlist.
	  * @namespace
	  * @memberOf module:html5podcatcher
	  * @public
	  */
	playlist: {
		/** 
		  * Get all episodes in the playlist.
		  * @public
		  * @returns {module:html5podcatcher/model/episodes~Episode[]} All episodes in the playlist sorted by date of last modification.
		  */
		get: function (onComplete) {
			// TODO async berücksichtigen
            storageProvider.readEpisodesByStatus(STATE_UNLISTEND, onComplete);
		}
	},
    
    /**
	  * This namespace contains all public functions for managing the storage subsystem.
	  * @namespace
	  * @memberOf module:html5podcatcher
	  * @public
	  */
    storagemanagement: {
        /** 
		  * Returns true is any kind of offline storage for files is available.
		  * @public
		  * @returns {Boolean} True if a file storage is available, false otherwise.
		  */
        isFileStorageAvailable: function () {
            return false;
        }
    }
}