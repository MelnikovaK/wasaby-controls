/* global define, $ws */
define('js!SBIS3.CONTROLS.Data.Format.TimeField', [
   "Core/IoC",
   "Core/ConsoleLogger",
   "js!WS.Data/Format/TimeField"
], function ( IoC, ConsoleLogger,TimeField) {
   'use strict';
   IoC.resolve('ILogger').error('SBIS3.CONTROLS.Data.Format.TimeField', 'Module is no longer available since version 3.7.4.100. Use WS.Data/Format/TimeField instead.');
   return TimeField;
});
