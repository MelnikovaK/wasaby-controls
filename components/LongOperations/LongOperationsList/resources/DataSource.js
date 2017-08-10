/**
 * Простая оболочка над SBIS3.CONTROLS.LongOperationsManager для имплементации интерфейса WS.Data/Source/ISource
 *
 * @class SBIS3.CONTROLS.LongOperationsListDataSource
 * @implements WS.Data/Source/ISource
 * @public
 */

define('js!SBIS3.CONTROLS.LongOperationsList/resources/DataSource',
   [
      'Core/core-extend',
      'js!WS.Data/Source/ISource',
      'js!WS.Data/Source/DataSet',
      'js!SBIS3.CONTROLS.LongOperationsManager',
      'js!SBIS3.CONTROLS.LongOperationEntry',
      'Core/TimeInterval'
   ],

   function (CoreExtend, ISource, DataSet, longOperationsManager, LongOperationEntry, TimeInterval) {
      'use strict';

      /**
       * Простая оболочка над SBIS3.CONTROLS.LongOperationsManager для имплементации интерфейса WS.Data/Source/ISource
       * @public
       * @type {object}
       */
      var LongOperationsListDataSource = CoreExtend.extend({}, [ISource], /** @lends SBIS3.CONTROLS.LongOperationsListDataSource.prototype */{
         _moduleName: 'SBIS3.CONTROLS.LongOperationsList/resources/DataSource',

         /**
          * Возвращает дополнительные настройки источника данных.
          * @return {Object}
          */
         getOptions: function () {
            return {
               navigationType: 'Page'
            };
         },

         /**
          * Выполняет запрос на выборку
          * @param {WS.Data/Query/Query} [query] Запрос
          * @return {Core/Deferred} Асинхронный результат выполнения. В колбэке придет {@link WS.Data/Source/DataSet}.
          */
         query: function (query) {
            var options = {};
            var filter = query.getWhere();
            if (filter) {
               var where = {};
               if (filter.status) {
                  var STATUSES = LongOperationEntry.STATUSES;
                  switch (filter.status) {
                     case 'running':
                     case 'suspended':
                     case 'ended':
                        where.status = STATUSES[filter.status];
                        break;
                     case 'not-suspended':
                        where.status = [STATUSES.running, STATUSES.ended];
                        break;
                     case 'success-ended':
                        where.status = STATUSES.ended;
                        where.isFailed = null;
                        break;
                     case 'error-ended':
                        where.status = STATUSES.ended;
                        where.isFailed = true;
                        break;
                  }
               }
               if (filter.period) {
                  where.startedAt = {condition:'>=', value:(new TimeInterval(filter.period)).subFromDate(new Date())};
               }
               if (filter.duration) {
                  where.timeSpent = {condition:'>=', value:(new TimeInterval(filter.duration)).getTotalMilliseconds()};
               }
               if (filter['СтрокаПоиска']) {
                  where.title = {condition:'contains', value:filter['СтрокаПоиска'], sensitive:false};
                  /*if (filter.usePages) {
                  }*/
               }
               if (filter.UserId) {
                  where.userId = filter.UserId;
               }
               if (Object.keys(where).length) {
                  options.where = where;
               }
            }
            var sorting = query.getOrderBy();
            if (sorting && sorting.length) {
               options.orderBy = sorting;
            }
            var offset = query.getOffset();
            if (0 <= offset) {
               options.offset = offset;
            }
            var limit = query.getLimit();
            if (0 < limit) {
               options.limit = limit;
            }
            if (filter.needUserInfo) {
               options.extra = {needUserInfo:true};
            }
            return longOperationsManager.fetch(Object.keys(options).length ? options : null).addCallback(function (recordSet) {
               var meta = recordSet.getMetaData()
               var dataSet = new DataSet({
                  rawData: {
                     items: recordSet.getRawData(),
                     more: meta && meta.more
                  },
                  idProperty: recordSet.getIdProperty(),
                  itemsProperty: 'items',
                  totalProperty: 'more',
                  model: recordSet.getModel()
               });
               return dataSet;
            });
         }
      });



      return LongOperationsListDataSource;
   }
);
