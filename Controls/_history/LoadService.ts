import Deferred = require('Core/Deferred');
var COUNT_HISTORY_ITEMS = 12;
var HistoryService;

function createHistoryService(historyServiceLoad, config) {
   config.recent = config.recent || COUNT_HISTORY_ITEMS;

   return historyServiceLoad.callback(new HistoryService(config));
}

export = function (config) {
   var historyServiceLoad = new Deferred();

   if (HistoryService) {
      createHistoryService(historyServiceLoad, config);
   } else {
      require(['Controls/_history/Service'], function (service) {
         HistoryService = service;
         createHistoryService(historyServiceLoad, config);
      });
   }

   return historyServiceLoad;
};