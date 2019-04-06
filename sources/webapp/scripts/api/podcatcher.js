/** The HTML5Podcatcher API

    @module  podcatcher
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:podcatcher/utils/logging
    @requires module:podcatcher/web/fetch
    @requires module:podcatcher/model/sourcelist
    @license Copyright 2019 Sebastian Spautz

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

import { logManager } from './utils/logging.js'
import WebAccessProvider from './web/fetch.js'
import Sourcelist from './model/sourcelist'

const api = {
  model: {
    Sources: Sourcelist
  },
  configuration: {
    logging: {
      addLogAppender: (appender) => logManager.addLogAppender(appender)
    }
  },
  web: new WebAccessProvider(null) // Temporär für umgestalltung auf Module
}

window.podcatcher = api

export default api
