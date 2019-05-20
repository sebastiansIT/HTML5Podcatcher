/** Logger that show messages as notifications.

    @module  h5p/utils/logging/notification
    @author  Sebastian Spautz [sebastian@human-injection.de]
    @requires module:h5p/notifications
    @requires HTML5PodcatcherAPI
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
import { notificationManager } from '../../notifications/notifications.js'

/** A log appender that creates notifications for log messages.
  * @class
  * @augments @external:AbstractLogAppender
  */
export class NotificationLogAppender {
  /** Creates a notification with the log message.
    * @param {external:String} message The log message.
    * @param {external:String} logLevelName The level of the message.
    * @param {external:String} module The source of the message.
    * @returns {undefined}
    */
  logMessage (message, logLevelName, module) {
    notificationManager.showNotification(message, 'H5P' + module)
      .catch((error) => {
        console.error(error)
      })
  }
}
