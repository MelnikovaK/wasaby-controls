/* global define, $ws */
define('js!SBIS3.CONTROLS.Data.Query.IQueryable', ['js!WS.Data/Query/IQueryable'], function (IQueryable) {
   'use strict';
   $ws.single.ioc.resolve('ILogger').error('SBIS3.CONTROLS.Data.Query.IQueryable', 'Module is no longer available since version 3.7.4.100. Use WS.Data/Query/IQueryable instead.');
   return IQueryable;
});
