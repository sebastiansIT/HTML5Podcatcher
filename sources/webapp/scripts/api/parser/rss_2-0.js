/** This modul contains functions to parse XML format "RSS 2.0".
 * See https://cyber.harvard.edu/rss/rss.html for the specification.
 *
 * @module  podcatcher/parser/RSS20
 * @author  SebastiansIT [sebastian@human-injection.de]
 * @requires module:podcatcher/parser/PSC
 * @requires module:podcatcher/parser/NPT
 * @license GPL-3.0-or-later
 *
 * Copyright 2016, 2019, 2021 Sebastian Spautz
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

/* global HTML5Podcatcher */

import { findChaptersNode, parse } from './podloveSimpleChapter.js'
import NptParser from './normalPlayTime.js'

/** Parser for RSS 2.0 Feeds.
 *
 * @class
 * @implements {module:HTML5Podcatcher/Parser~ISourceParser#parse}
 */
class Parser {
  /** Create a new Parser with a static list of allowed MIME types of
   * *application/xml+rss*.
   */
  constructor () {
    this.allowedDocumentMimeTypes = ['application/xml+rss']
  }

  /** Returns the name of this parser.
   *
   * @returns {string} The name.
   */
  toString () {
    return 'RSS 2.0 Parser'
  }

  /** Parse the given RSS 2.0 document and update the defined source.
   *
   * @function
   * @name module:podcatcher/parser~ISourceParser#parse
   * @param {object} source The source to be importet.
   * @param {external:XMLDocument} xmlDocument The RSS 2.0 document to be parsed.
   * @returns {object} The updated source.
   */
  parse (source, xmlDocument) {
    const parserResult = {
      source: {
        uri: source.uri
      },
      episodes: []
    }

    if (!xmlDocument) {
      HTML5Podcatcher.logger(`No XML document found at ${source.uri}.`, 'error', 'parser')
      return undefined
    } else {
      // RSS-Feed
      const rootElement = xmlDocument.querySelector('rss[version="2.0"]')
      if (rootElement) {
        // RSS-Channel
        // * Actualise URI from atom link element with relation of "self"
        const currentElementList = rootElement.querySelectorAll('channel > link') // find all Link-Elements in the feed
        for (let i = 0; i < currentElementList.length; i += 1) {
          const currentElement = currentElementList[i]
          if (currentElement.namespaceURI === 'http://www.w3.org/2005/Atom' && currentElement.attributes.rel === 'self') {
            parserResult.source.uri = currentElement.href
            break
          }
        }
        // * Link to Website (<link> or <atom:link rel="self">)
        //   uses same list of elements (currentElementList) as the previous section
        for (let i = 0; i < currentElementList.length; i += 1) {
          const currentElement = currentElementList[i]
          if (!currentElement.namespaceURI) { // undefined Namespace is mostly the rss 'namespace' ;)
            parserResult.source.link = currentElement.childNodes[0].nodeValue
            break
          }
        }
        //   set default: Website is equals to Feed-URI
        if (!parserResult.source.link) {
          parserResult.source.link = parserResult.source.uri
        }
        // * Title (<title>)
        let currentElement = rootElement.querySelector('channel > title')
        if (currentElement && currentElement.childNodes.length > 0) {
          parserResult.source.title = currentElement.childNodes[0].nodeValue
        } else {
          parserResult.source.title = parserResult.source.link
        }
        // * Description (<description>)
        currentElement = rootElement.querySelector('channel > description')
        if (currentElement && currentElement.childNodes.length > 0) {
          parserResult.source.description = currentElement.childNodes[0].nodeValue
        } else {
          parserResult.source.description = ''
        }
        // * License (<copyright>)
        currentElement = rootElement.querySelector('channel > copyright')
        if (currentElement && currentElement.childNodes.length > 0) {
          parserResult.source.license = currentElement.childNodes[0].nodeValue
        } else {
          parserResult.source.license = undefined
        }
        // * Language (<language>)
        currentElement = rootElement.querySelector('channel > language')
        if (currentElement && currentElement.childNodes.length > 0) {
          parserResult.source.language = currentElement.childNodes[0].nodeValue
        } else {
          parserResult.source.language = undefined
        }
        // * Image (<image><url></image>)
        currentElement = rootElement.querySelector('channel > image > url')
        if (currentElement && currentElement.childNodes.length > 0) {
          parserResult.source.image = currentElement.childNodes[0].nodeValue
        }
        // Check for link to external PodLove Simple Chapters file
        Array.from(rootElement.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')).forEach((item, i) => {
          if (item.attributes.rel === 'http://podlove.org/simple-chapters') {
            HTML5Podcatcher.logger(`New feature needed: Should read chapters from external PSC file ${item.attributes.href}!`, 'warning', 'parser')
          }
        })
        // RSS-Entries
        const itemArray = rootElement.querySelectorAll('channel > item')
        for (let i = 0; i < itemArray.length; i += 1) {
          const item = itemArray[i]
          const episode = {
            language: parserResult.source.language,
            image: parserResult.source.image
          }
          // * URI of episode
          if (item.querySelector('link')) {
            // Try to get from RSS link element
            episode.uri = item.querySelector('link').childNodes[0].nodeValue
          } else if (item.querySelector('guid')) {
            // If there is no link element try to get it from GUID element
            episode.uri = item.querySelector('guid').childNodes[0].nodeValue
          } else {
            HTML5Podcatcher.logger('No URI found - invalid RSS item', 'error')
            break
          }
          // * Title of episode
          episode.title = item.querySelector('title').childNodes[0].nodeValue
          // * Subtitle of episode
          currentElement = item.getElementsByTagNameNS('http://www.itunes.com/dtds/podcast-1.0.dtd', 'subtitle')
          if (currentElement && currentElement.length > 0 && currentElement[0].childNodes.length > 0) {
            episode.subTitle = currentElement[0].childNodes[0].nodeValue
          }
          // * Duration of episode
          currentElement = item.getElementsByTagNameNS('http://www.itunes.com/dtds/podcast-1.0.dtd', 'duration')
          if (currentElement && currentElement.length > 0 && currentElement[0].childNodes.length > 0) {
            episode.duration = NptParser(currentElement[0].childNodes[0].nodeValue)
          }
          // * pubDate of episode
          const pubDateElement = item.querySelector('pubDate')
          if (pubDateElement && pubDateElement.childNodes.length >= 1) {
            if (/^\d/.test(pubDateElement.childNodes[0].nodeValue)) {
              episode.updated = new Date('Sun ' + pubDateElement.childNodes[0].nodeValue)
            } else {
              episode.updated = new Date(pubDateElement.childNodes[0].nodeValue)
            }
          } else {
            episode.updated = undefined
          }
          // * Source of this episode
          episode.source = parserResult.source.title
          // * Audio-File (Atachement | Enclosure)
          // use files linked with enclosure elements or ...
          const enclosureArray = item.querySelectorAll('enclosure')
          for (let j = 0; j < enclosureArray.length; j += 1) {
            // accept only audio files
            if (enclosureArray[j].attributes.type.value.indexOf('audio') >= 0) {
              // map audio/opus to audio/ogg with codec of opus (Firefox don't understand audio/opus)
              if (enclosureArray[j].attributes.type.value === 'audio/opus') {
                episode.mediaType = 'audio/ogg; codecs=opus'
              } else {
                episode.mediaType = enclosureArray[j].attributes.type.value
              }
              episode.mediaUrl = enclosureArray[j].attributes.url.value
            }
          }
          // ... or use anker tags in the full content markup of the item
          if (!episode.mediaUrl && item.querySelector('encoded') && item.querySelector('encoded').childNodes[0].nodeValue) {
            // contentElement = xmlDocument.createElement('encoded');
            const contentElement = document.createDocumentFragment() // use document instead of xmlDocument because the nodeValue can contains HTML-Entities that are not supported in XML.
            const nodeValue = item.querySelector('encoded').childNodes[0].nodeValue
            contentElement.innerHTML = nodeValue
            if (contentElement.querySelector('a[href$=".m4a"]')) {
              episode.mediaUrl = contentElement.querySelector('a[href$=".m4a"]').attributes.href.value
              episode.mediaType = 'audio/mp4'
            } else if (contentElement.querySelector('a[href$=".mp3"]')) {
              episode.mediaUrl = contentElement.querySelector('a[href$=".mp3"]').attributes.href.value
              episode.mediaType = 'audio/mpeg'
            } else if (contentElement.querySelector('a[href$=".oga"]')) {
              episode.mediaUrl = contentElement.querySelector('a[href$=".oga"]').attributes.href.value
              episode.mediaType = 'audio/ogg'
            } else if (contentElement.querySelector('a[href$=".opus"]')) {
              episode.mediaUrl = contentElement.querySelector('a[href$=".opus"]').attributes.href.value
              episode.mediaType = 'audio/ogg; codecs=opus'
            }
          }

          episode.jumppoints = parse(findChaptersNode(item))

          // Check for link to external PodLove Simple Chapters file
          Array.from(item.getElementsByTagNameNS('http://www.w3.org/2005/Atom', 'link')).forEach((link, i) => {
            if (link.attributes.rel === 'http://podlove.org/simple-chapters') {
              HTML5Podcatcher.logger(`New feature needed: Should read chapters from external PSC file ${link.attributes.href}!`, 'warning', 'parser')
            }
          })
          // Check for Podcast 2.0 chapters feature
          // example: <podcast:chapters url="https://example.com/episode1/chapters.json" type="application/json+chapters" />
          Array.from(item.getElementsByTagNameNS('https://podcastindex.org/namespace/1.0', 'chapters')).forEach((chaptersRef, i) => {
            HTML5Podcatcher.logger(`New feature needed: Should read chapters from external Podcast 2.0 chapters declaration ${chaptersRef.attributes.url}{} in ${parserResult.source.title}!`, 'warning', 'parser')
          })

          parserResult.episodes.push(episode)
        }
        parserResult.episodes.sort(HTML5Podcatcher.sortEpisodes)
      } else {
        HTML5Podcatcher.logger(`No root element (&lt;rss&gt;) found in parsed document: ${xmlDocument}`, 'error', 'parser')
        return undefined
      }

      return parserResult
    }
  }
}

const rss20SourceParser = new Parser()
export default rss20SourceParser
