define('Controls/Input/Date/RangeLinkLite', [
   'Controls/dateRange'/*,
   'Env/Env:IoC'*/
], function(
   dateRangeLib/*,
   IoC*/
) {
   'use strict';

   /*IoC.resolve('ILogger').error(
      'Controls/dateRange:Input' +
      'This control is deprecated. Use \'Controls/dateRange:LiteSelector\' instead'
   );*/

   return dateRangeLib.LiteSelector;
});
