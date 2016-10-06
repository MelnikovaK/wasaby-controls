/* global define, $ws */
define('js!SBIS3.CONTROLS.Data.Format.DateField', [
   "Core/IoC",
   "Core/ConsoleLogger",
   "js!WS.Data/Format/DateField"
], function ( IoC, ConsoleLogger,DateField) {
   'use strict';
   IoC.resolve('ILogger').error('SBIS3.CONTROLS.Data.Format.DateField', 'Module is no longer available since version 3.7.4.100. Use WS.Data/Format/DateField instead.');
   return DateField;
});
