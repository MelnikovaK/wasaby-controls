import {Service as HistoryService, FilterSource as HistorySource, Constants} from 'Controls/history';

import {Controller as SourceController} from 'Controls/source';
import entity = require('Types/entity');
import collection = require('Types/collection');
import sourceLib = require('Types/source');
import Env = require('Env/Env');
import Di = require('Types/di');


var HISTORY_SOURCE = {};

function destroyHistorySource(historyId) {
   HISTORY_SOURCE[historyId].destroy({}, {
      '$_history': true
   });
   HISTORY_SOURCE[historyId] = null;
}

function createHistorySource(historyId) {
   var historySourceData = {
      historyId: historyId,
      pinned: true,

      /* A record about resets filters is stored in the history, but it is not necessary to display it in the history list.
         We request one more record, so that the number of records remains equal to 10 */
      recent: Constants.MAX_HISTORY + 1,

      dataLoaded: true
   };
   return new HistorySource({
      originSource: new sourceLib.Memory({
         idProperty: 'id',
         data: []
      }),
      historySource: Di.isRegistered('demoSourceHistory') ? Di.resolve('demoSourceHistory', historySourceData)
         : new HistoryService(historySourceData)
   });
}

function getHistorySource(historyId) {
   if (Env.constants.isBuildOnServer) {
      return createHistorySource(historyId);
   } else {
      HISTORY_SOURCE[historyId] = HISTORY_SOURCE[historyId] || createHistorySource(historyId);
   }
   return HISTORY_SOURCE[historyId];
}

function loadHistoryItems(historyId) {
   var source = getHistorySource(historyId);
   var sourceController = new SourceController({
      source: source
   });
   return sourceController.load({
      '$_history': true
   }).addCallback(function(items) {
      return new collection.RecordSet({
         rawData: items.getRawData(),
         adapter: new entity.adapter.Sbis()
      });
   });
}

export = {
   loadHistoryItems: loadHistoryItems,
   getHistorySource: getHistorySource,
   destroyHistorySource: destroyHistorySource
};
