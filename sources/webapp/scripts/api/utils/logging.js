/** Logging functionality.
 *
 *  @module  podcatcher/utils/logging
 *  @author  Sebastian Spautz [sebastian@human-injection.de]
 *  @license GPL-3.0-or-later
 *
 *  Copyright 2019 Sebastian Spautz
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

/** Transfers the named LogLevel to a number.
 *
 * @param {external:String} level The named log level.
 * @returns {number} A code number corresponding to the log level.
 */
function transferLevelToCode (level) {
  let code = 0
  switch (level) {
    case 'debug':
      code = 10
      break
    case 'info':
      code = 20
      break
    case 'note':
      code = 30
      break
    case 'warn':
      code = 40
      break
    case 'error':
      code = 50
      break
    case 'fatal':
      code = 60
      break
    default:
      code = 0
  }
  return code
}

/** Abstract appender - implementations of this class appends log messages
 * to an output chanel.
 *
 * @class
 * @abstract
 */
export class AbstractLogAppender {
  /** Append a log message to the output channel.
   *
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

/** Log Appender that add all messages to the browser console.
 *
 * @class
 * @private
 * @augments module:podcatcher/utils/logging.AbstractLogAppender
 */
class ConsoleLogAppender extends AbstractLogAppender {
  /** Logs a message with the given level.
   *
   * @param {string} message The message.
   * @param {string} logLevelName The name of the level.
   * @param {string} module The name of the module.
   */
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
 *
 * @class
 */
class LogManager {
  /** Creates a new LogManager. */
  constructor () {
    this.logRules = []
  }

  /** Log a given message to all configured appenders.
   *
   * @param {external:String} message The log message.
   * @param {external:String} logLevelName The level of the message.
   * @param {external:String} module The source of the message.
   * @returns {undefined}
   */
  logMessage (message, logLevelName, module) {
    this.logRules.forEach((rule) => {
      const messageLevelCode = transferLevelToCode(logLevelName)

      if (rule.minLevel <= messageLevelCode) {
        if (rule.maxLevel >= messageLevelCode) {
          rule.appender.logMessage(message, logLevelName, module)
        }
      }
    })
  }

  /** Adds a new Rule to the Log Manager.
   *
   * @param {module:podcatcher/utils/logging.AbstractLogAppender} logAppender A log appender used in this rule.
   * @param {external:String} minLevel The minimal level of messages to log with the given appender.
   * @param {external:String} maxLevel The maximal level of messages to log with the given appender.
   * @returns {undefined}
   */
  addLogRule (logAppender, minLevel, maxLevel) {
    this.logRules.push({
      minLevel: transferLevelToCode(minLevel || 'debug'),
      maxLevel: transferLevelToCode(maxLevel || 'fatal'),
      appender: logAppender
    })
  }
}

/** Exports a singelton Instance of LogManager.
 *
 * @constant {module:podcatcher/utils/logging~LogManager}
 */
export const logManager = new LogManager()
logManager.addLogRule(new ConsoleLogAppender(), 'debug', 'fatal')

/** This class allows to log messages scoped with a module name.
 *
 * @class
 */
export class Logger {
  /** Creates a logger for the given source code module.
   *
   * @param {external:String} module The source of the messages created with this logger.
   */
  constructor (module) {
    this.module = module
  }

  /** Log a message with level "debug".
   *
   * @param {external:String} message The message to log with level "debug".
   */
  debug (message) {
    logManager.logMessage(message, 'debug', this.module)
  }

  /** Log a message with level "information".
   *
   * @param {external:String} message The message to log with level "information".
   */
  info (message) {
    logManager.logMessage(message, 'info', this.module)
  }

  /** Log a message with level "note".
   *
   * @param {external:String} message The message to log with level "note".
   */
  note (message) {
    logManager.logMessage(message, 'note', this.module)
  }

  /** Log a message with level "warning".
   *
   * @param {external:String} message The message to log with level "warning".
   */
  warn (message) {
    logManager.logMessage(message, 'warn', this.module)
  }

  /** Log a message with level "error".
   *
   * @param {external:String} message The message to log with level "error".
   */
  error (message) {
    logManager.logMessage(message, 'error', this.module)
  }

  /** Log a message with level "fatal".
   *
   * @param {external:String} message The message to log with level "fatal".
   */
  fatal (message) {
    logManager.logMessage(message, 'fatal', this.module)
  }
}
