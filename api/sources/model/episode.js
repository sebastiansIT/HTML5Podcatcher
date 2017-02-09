/** 
  * Contains a single class representing podcast episodes.
  * @module html5podcatcher/model/episodes
  * @license Copyright 2017 Sebastian Spautz

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
    along with this program. If not, see http://www.gnu.org/licenses/.
  */

export const STATE_UNLISTEND = Symbol("Unslistend Episode");
export const STATE_LISTEND = Symbol("Listend Episode");
  
/** 
  * Objects of this class representing single episodes of a podcast or a source feed.
  * @class 
  * @constructs module:html5podcatcher/model/episodes~Episode
  * @param {URI} uri - The URI identifing this episode.
  * @param {Object} [properties={}] - Additional parameter to initialise the episode object.
  */
export default function Episode(uri, properties) {
	//TODO Check uri as required parameter
    properties = properties || {}
    
    /** 
      * The URI identifing the episode.
      * @type {URI}
      */
    this.uri = uri;
    this.title = properties.title || properties.titel;
    this.subTitle = properties.subTitle;
    this.updated = properties.updated;
    this.language = properties.language;
    
    this.source = properties.source;
	
    this.mediaUrl = properties.mediaUrl;
    this.mediaType = properties.mediaType;
	this.duration = properties.duration;
    
    this.playback = {};
    this.playback.currentTime = 0;
    this.playback.played = false;
    if (properties.playback) {
        this.playback.currentTime = properties.playback.currentTime || 0;
        this.playback.played = properties.playback.played || false;
    }
    
    this.jumppoints = properties.jumppoints || [];
};

/** 
  * @member module:html5podcatcher/model/episodes~Episode
  * @returns {String} A string representation
  */
Episode.prototype.toString = function() {
	return this.titel;
}