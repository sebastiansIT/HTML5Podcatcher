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
  
import Episode from './model/episode';
  
/** 
  * Array of episodes in the playlist
  * @private
  * @type {Episodes[]}
  */
var playlist = [];
playlist.push(new Episode('http://www.podcast.local/episode1', {name: 'Episode 1', playback: {}, updated: new Date()}));
//playlist.push({uri: 'http://www.podcast.local/episode2'});

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
		  * @returns {Episodes[]} All episodes in the playlist sorted by date of last modification.
		  */
		get: function () {
			return playlist;
		}
	}
}