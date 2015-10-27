/** This modul defines the datatypes for podcasts (alias sources or feeds), episodes and some other inner types.

	 @module  HTML5Podcatcher/Model
	 @author  Sebastian Spautz [sebastian@human-injection.de]
	 @license Copyright 2015 Sebastian Spautz

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

/*global HTML5Podcatcher */

var dataModel = (function () {
	"use strict";
	var Source, Episode, JumpPoint;

	/** A JumpPoint is a timestampe of a type and an optional title.
      *
	  * @class
	  * @param {number} time - The timestamp of the jump point. It is a number of milliseconds from the begin of an audio file.
	  */
	JumpPoint = function (time) {
		
        /** Milliseconds from begin of the audio file.
          *
          * @type {number}
          */
		this.time = time;
		
        /** Type of the JumpPoint
          *
          * @type {['chapter']}
          * @default 'chapter'
          */
		this.type = 'chapter';
		
        /** Title of the JumpPoint
          *
          * @type {string}
          * @default 'Unnamed Chapter'
          */
		this.title = 'Unnamed Chapter';
	};

	/** Each single element of a Source is a Episode.
      *
	  * @class
	  * @param {URI} uri - The identifier for the episode.
	  */
	Episode = function (uri) {
		this.uri = uri;
		this.title = undefined;
		this.source = undefined;
		this.updated = undefined;
		this.mediaUrl = undefined;
		this.mediaType = undefined;
		this.isFileSavedOffline = false;
		this.playback = {
			played: false,
			currentTime: 0
		};
		this.jumppoints = [];
	};

	/** A Source can be a RSS-Feed or somthing else you want to subscribe to.
      *
	  * @class
	  * @param {URL} url - The identifier for the episode. It is also the internet address of the source (the feed URL).
	  */
	Source = function (url) {
		this.url = url;
	};

	// ====================================== //
	// === Export public Elements         === //
	// ====================================== //
	return {
		JumpPoint: JumpPoint,
		Episode: Episode,
		Source: Source
	};
}());

/** The modul "Model" is available at document.HTML5Podcatcher.api.model.
  * @global 
  * @name "HTML5Podcatcher.api.model"
  * @see module:HTML5Podcatcher/Model
  */
HTML5Podcatcher.api.model = dataModel;