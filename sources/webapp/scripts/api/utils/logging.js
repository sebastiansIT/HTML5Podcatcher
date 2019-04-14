/** Copyright 2019 Sebastian Spautz

     @module  podcatcher/utils/logging
     @author  Sebastian Spautz [sebastian@human-injection.de]
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
/**
 * The built in string object.
 * @external String
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String|String}
 */

/** Abstract appender - implementations of this class appends log messages
  * to an output chanel
  * @class
  * @abstract
  */
export class AbstractLogAppender {
  /** Append a log message to the output channel.
    * @abstract
    * @param {external:String} message The log message.
    * @param {external:String} logLevelName The level of the message.
    * @param {external:String} module The source of the message.
    * @returns {undefined}
    */
  logMessage (message, logLevelName, module) {
    throw new Error('Not Implemented!')
  }
}

/** Log Appender that add all messages to the browser console
  * @class
  * @private
  * @augments module:podcatcher/utils/logging.AbstractLogAppender
  */
class ConsoleLogAppender extends AbstractLogAppender {
  logMessage (message, logLevelName, module) {
    // Log to the console
    message = `Module ${module} says: ${message}`
    switch (logLevelName) {
      case 'debug':
        console.debug(message)
        break
      case 'info':
        console.info(message)
        break
      case 'note':
        console.info(message)
        break
      case 'warn':
        console.warn(message)
        break
      case 'error':
        console.error(message)
        break
      case 'fatal':
        console.error(message)
        break
      default:
        console.log(`${message} (${logLevelName})`)
    }
  }
}

/** Class to manage configuration of logging subsystem and routes all incoming
  * messages to the relevant appenders.
  * @class
  * @private
  */
class LogManager {
  /** Creates a new LogManager. A console log appender for all messages is
    * preconfigured.
    * @constructs
    */
  constructor () {
    this.logAppender = []
    this.logAppender.push(new ConsoleLogAppender())
  }

  /** log a given message to all configured appenders.
    * @param {external:String} message The log message.
    * @param {external:String} logLevelName The level of the message.
    * @param {external:String} module The source of the message.
    * @returns {undefined}
    */
  logMessage (message, logLevelName, module) {
    this.logAppender.forEach((appender) => appender.logMessage(message, logLevelName, module))
  }

  /**
    * @param {module:podcatcher/utils/logging.AbstractLogAppender} logAppender A log Appender used by this log manager.
    * @return {undefined}
    */
  addLogAppender (logAppender) {
    this.logAppender.push(logAppender)
  }
}

/** Exports a singelton Instance of LogManager.
  * @constant {module:podcatcher/utils/logging~LogManager}
  */
export const logManager = new LogManager()

/** This class generates a logger by instantiate with a module name.
  * @class
  */
export class Logger {
  /** Creates a logger for the given source code module.
    * @constructs
    * @param {external:String} module The source of the messages created with this logger.
    */
  constructor (module) {
    this.module = module
  }

  /** Log a message with level "debug".
    * @param {external:String} message The message to log with level "debug".
    */
  debug (message) {
    logManager.logMessage(message, 'debug', this.module)
  }

  /** Log a message with level "information".
    * @param {external:String} message The message to log with level "information".
    */
  info (message) {
    logManager.logMessage(message, 'info', this.module)
  }

  /** Log a message with level "note".
    * @param {external:String} message The message to log with level "note".
    */
  note (message) {
    logManager.logMessage(message, 'note', this.module)
  }

  /** Log a message with level "warning".
    * @param {external:String} message The message to log with level "warning".
    */
  warn (message) {
    logManager.logMessage(message, 'warn', this.module)
  }

  /** Log a message with level "error".
    * @param {external:String} message The message to log with level "error".
    */
  error (message) {
    logManager.logMessage(message, 'error', this.module)
  }

  /** Log a message with level "fatal".
    * @param {external:String} message The message to log with level "fatal".
    */
  fatal (message) {
    logManager.logMessage(message, 'fatal', this.module)
  }
}