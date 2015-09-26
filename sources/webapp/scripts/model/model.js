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

var dataModel = (function () {
   "use strict";
   var Source, Episode, JumpPoint;

   /**
     * @class
     * @constructs
     * @param {timestamp} time - The timestamp of the jump point.
     */
   JumpPoint = function (time) {
      /** 
        * @memberof
        * @type {timestamp}
        */
      this.time = time;
      /** 
        * @memberof 
        * @type {'chapter'}
        */
      this.type = 'chapter';
      /** 
        * @memberof 
        * @type {string}
        */
      this.title = 'Unnamed Chapter';
   };

   /**
     * @class
     * @constructs
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

   /**
     * @class
     * @constructs
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