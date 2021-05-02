/** Contains a class to represent a set of podcast sources.
 *
    @module podcatcher/model/sourcelist
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:podcatcher/utils/logging
 * @license GPL-3.0-or-later
 *
 * Copyright 2019 Sebastian Spautz
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

import { Logger } from '../utils/logging.js'

/** Logger.
 *
 * @constant {module:podcatcher/utils/logging.Logger}
 * @private
 */
const LOGGER = new Logger('Model/Sourcelist')

/** Instances of this class represents a set of source objects.
 *
 * @class
 * @param {module:podcatcher/model/sources.Source[]} sources An array of sources.
 */
export default class Sourcelist {
  /** Create a new list with the given sources.
   *
   * @param {module:podcatcher/model/sources.Source[]} sources An array of sources.
   */
  constructor (sources) {
    this._sources = sources
  }

  /** Return a sorted array of sources.
   *
   * @returns {module:podcatcher/model/sources.Source[]} A sorted array of sources.
   */
  get sources () {
    // TODO go direct to a storage manager
    LOGGER.debug('Get sorted list of sources')
    return this._sources.sort(sourceComparator)
  }
}

/** Comparator sources based on the title (case insensitive).
 *
 * @private
 * @param {module:podcatcher/model/sources.Source} first The first source to compare.
 * @param {module:podcatcher/model/sources.Source} second The second source to compare.
 * @returns {number} -1 if title of the first source is lexicographical smaller than
 *   the second. Zero if both titles are identical. 0 otherwise.
 */
function sourceComparator (first, second) {
  return first.title.toLowerCase().localeCompare(second.title.toLowerCase())
}
