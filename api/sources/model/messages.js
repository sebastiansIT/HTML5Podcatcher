/** 
  * Contains a single class representing log message.
  * @module html5podcatcher/model/messages
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
  
/** 
  * Objects of this class representing single log messages.
  * @class
  * @constructs module:html5podcatcher/model/messages~Message
  * @param {String} Text - Text of the message.
  */
export default function Message(text) {
	this.text = text;
}