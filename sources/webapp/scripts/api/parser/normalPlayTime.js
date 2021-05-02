/** This modul contains functions to parse XML format "Podlove Simple Chapter".

  @module  podcatcher/parser/NPT
  @author  Sebastian Spautz [sebastian@human-injection.de]
  @license GPL-3.0-or-later

  Copyright 2021 Sebastian Spautz

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

/** Parse a String in normal play time. For this format
 *  see https://www.ietf.org/rfc/rfc2326.txt Chapter 3.6.
 *
 * @param {string} normalPlayTime String in normal play time format.
 * @returns {number} Timecode in milliseconds.
 */
export default function parse (normalPlayTime) {
  let milliseconds
  let parts = normalPlayTime.split('.')
  if (parts[1]) {
    milliseconds = parseFloat('0.' + parts[1]) * 1000
  } else {
    milliseconds = 0
  }
  parts = parts[0].split(':')
  if (parts.length === 3) {
    milliseconds = milliseconds + parseInt(parts[2], 10) * 1000
    milliseconds = milliseconds + parseInt(parts[1], 10) * 60 * 1000
    milliseconds = milliseconds + parseInt(parts[0], 10) * 60 * 60 * 1000
  } else if (parts.length === 2) {
    milliseconds = milliseconds + parseInt(parts[1], 10) * 1000
    milliseconds = milliseconds + parseInt(parts[0], 10) * 60 * 1000
  } else if (parts.length === 1) {
    milliseconds = milliseconds + parseInt(parts[0], 10) * 1000
  }
  return milliseconds
}
