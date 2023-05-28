/** This module contains functions to load informations and files from the web.

    @module  HTML5Podcatcher/Web/Fetch
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:HTML5Podcatcher/Configuration
    @license Copyright 2023 Sebastian Spautz

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

/** Load an XML document from the given URL.
  * @param {URL} url - The URL to load.
  */
export async function downloadXML(url) {
    return self.fetch(url, {
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {
            'Content-Type': 'text/xml'
        }
    }).then((response) => {
        return response.text()
    }).then((text) => {
        return new DOMParser().parseFromString(text, 'text/xml')
    }) 
}