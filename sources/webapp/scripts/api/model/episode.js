/**
 * All things to handle episodes.
 * @module podcatcher/model/episode
 * @author  Sebastian Spautz [sebastian@human-injection.de]
 * @license GPL-3.0-or-later
 *
 * Copyright 2021 Sebastian Spautz
 *
 * This file is part of "HTML5 Podcatcher".
 *
 * "HTML5 Podcatcher" is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * any later version.
 *
 * "HTML5 Podcatcher" is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see http://www.gnu.org/licenses/.
 */

/**
 *
 */
export default class Episode {
  /**
   * Create a episode.
   * @param {external:URL} uri The URI of the episode.
   */
  constructor (uri) {
    this.uri = uri
    this.title = undefined
    this.source = undefined
    this.updated = undefined
    this.mediaUrl = undefined
    this.mediaType = undefined
    this.isFileSavedOffline = false
    this.playback = {
      played: false,
      currentTime: 0
    }
    this.jumppoints = []
  }

  /**
   * Toggles the playback status of the episode.
   * @returns {undefined}
   */
  tooglePlaybackStatus () {
    this.playback.played = !this.playback.played
    this.playback.currentTime = 0
  }
}

/**
 *
 * @param episode
 */
export function toggleEpisodeStatus (episode) {
  episode.playback.played = !episode.playback.played
  episode.playback.currentTime = 0
}

/**
 * Comparator sources based on the title (case insensitive).
 *
 * The first comparing parameter is the date last updated. If this is equals the
 * title is compared.
 * @private
 * @param {module:podcatcher/model/episode.Episode} first The first episode to compare.
 * @param {module:podcatcher/model/episode.Episode} second The second episode to compare.
 * @returns {number} -1 if the first episodes  is smaller than
 *   the second. Zero if both are identical. 0 otherwise.
 */
export function comparator (first, second) {
  if (first.updated < second.updated) {
    return -1
  }
  if (first.updated > second.updated) {
    return 1
  }
  return first.title.toLowerCase().localeCompare(second.title.toLowerCase())
}
