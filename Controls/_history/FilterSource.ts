/**
 * Created by am.gerasimov on 21.03.2018.
 */
import CoreExtend = require('Core/core-extend');
import collection = require('Types/collection');
import Constants = require('Controls/_history/Constants');
import sourceLib = require('Types/source');
import chain = require('Types/chain');
import entity = require('Types/entity');
import {isEqual} from 'Types/object';
import Serializer = require('Core/Serializer');

var historyMetaFields = ['$_favorite', '$_pinned', '$_history', '$_addFromData'];
var DEFAULT_FILTER = '{}';

var _private = {
   getSourceByMeta: function (self, meta) {
      for (var i in meta) {
         if (meta.hasOwnProperty(i)) {
            if (historyMetaFields.indexOf(i) !== -1) {
               return self.historySource;
            }
         }
      }
      return self.originSource;
   },

   deserialize: function (self, data) {
      return JSON.parse(data, this.getSerialize(self).deserialize);
   },

   initHistory: function (self, data) {
      if (data.getRow) {
         var rows = data.getRow();
         var pinned = rows.get('pinned');
         var recent = rows.get('recent');
         var frequent = rows.get('frequent');

         self._history = {
            pinned: pinned,
            frequent: frequent,
            recent: recent
         };
      } else {
         self._history = data;
      }
   },

   getItemsWithHistory: function (self, history) {
      var items = new collection.RecordSet({
         adapter: new entity.adapter.Sbis(),
         keyProperty: 'ObjectId'
      });

      this.addProperty(this, items, 'ObjectId', 'string', '');
      this.addProperty(this, items, 'ObjectData', 'string', '');
      this.addProperty(this, items, 'pinned', 'boolean', false);

      if (self.historySource._pinned !== false) {
         this.fillPinned(self, history, items);
      }
      this.fillRecent(self, history, items);

      return items;
   },

   fillPinned: function (self, history, items) {
      var config = {
         adapter: new entity.adapter.Sbis()
      };
      var item, rawData;

      chain.factory(history.pinned).filter(function (element) {
         return element.get('ObjectData') !== DEFAULT_FILTER;
      }).value(collection.factory.recordSet, config).forEach(function (element) {
         rawData = {
            d: [
               element.getId(),
               element.get('ObjectData'),
               element.get('HistoryId')
            ],
            s: [{
                  n: 'ObjectId',
                  t: 'Строка'
               },
               {
                  n: 'ObjectData',
                  t: 'Строка'
               },
               {
                  n: 'HistoryId',
                  t: 'Строка'
               }
            ]
         };
         item = new entity.Model({
            rawData: rawData,
            adapter: element.getAdapter(),
            format: items.getFormat()
         });

         item.set('pinned', true);
         items.add(item);
      });
   },

   fillRecent: function (self, history, items) {
      var config = {
         adapter: new entity.adapter.Sbis()
      };
      var maxLength = self.historySource._recent - history.pinned.getCount() - 1;
      var currentCount = 0;
      var item, rawData, isPinned;

      chain.factory(history.recent).filter(function (element) {
         isPinned = history.pinned.getRecordById(element.getId());
         if (!isPinned && element.get('ObjectData') !== DEFAULT_FILTER) {
            currentCount++;
         }
         return !isPinned && currentCount <= maxLength && element.get('ObjectData') !== DEFAULT_FILTER;
      }).value(collection.factory.recordSet, config).forEach(function (element) {
         rawData = {
            d: [
               element.getId(),
               element.get('ObjectData'),
               element.get('HistoryId')
            ],
            s: [{
                  n: 'ObjectId',
                  t: 'Строка'
               },
               {
                  n: 'ObjectData',
                  t: 'Строка'
               },
               {
                  n: 'HistoryId',
                  t: 'Строка'
               }
            ]
         };
         item = new entity.Model({
            rawData: rawData,
            adapter: element.getAdapter()
         });
         items.add(item);
      });
   },

   addProperty: function (self, record, name, type, defaultValue) {
      if (record.getFormat().getFieldIndex(name) === -1) {
         record.addField({
            name: name,
            type: type,
            defaultValue: defaultValue
         });
      }
   },

   updatePinned: function (self, item) {
      var pinned = self._history.pinned;
      if (item.get('pinned')) {
         item.set('pinned', false);
         pinned.remove(pinned.getRecordById(item.getId()));
      } else {
         item.set('pinned', true);
         pinned.add(this.getRawHistoryItem(self, item.getId(), item.get('ObjectData'), item.get('HistoryId')));
      }
      self.historySource.saveHistory(self._history);
   },

   updateRecent: function (self, item) {
      var id = item.getId();
      var recent = self._history.recent;
      var hItem = recent.getRecordById(id);
      var records;

      if (hItem) {
         recent.remove(hItem);
      }

      records = new collection.RecordSet({
         items: [this.getRawHistoryItem(self, item.getId(), item.get('ObjectData'), item.get('HistoryId'))]
      });
      recent.prepend(records);
      self.historySource.saveHistory(self._history);
   },

   getRawHistoryItem: function (self, id, objectData, hId) {
      return new entity.Model({
         rawData: {
            d: [id, objectData, hId || self.historySource.getHistoryId()],
            s: [{
                  n: 'ObjectId',
                  t: 'Строка'
               },
               {
                  n: 'ObjectData',
                  t: 'Строка'
               },
               {
                  n: 'HistoryId',
                  t: 'Строка'
               }
            ]
         },
         adapter: self._history.recent.getAdapter()
      });
   },

   getHistoryItem: function (self, data) {
      var history = self._history;

      return this.findItem(self, history.pinned, data) || this.findItem(self, history.recent, data) || null;
   },

   findItem: function (self, items, data) {
      var myself = this;
      var item = null;
      var objectData;
      var deserialize = myself.getSerialize(self).deserialize;

      items.forEach(function (element) {
         objectData = element.get('ObjectData');
         if (objectData && isEqual(JSON.parse(objectData, deserialize), data)) {
            item = element;
         }
      });
      return item;
   },

   // Serializer при сериализации кэширует инстансы по идентификаторам,
   // и при десериализации, если идентификатор есть в кэше, берёт инстанс оттуда
   // Поэтому, когда применяем фильтр из истории,
   // идентификатор в сериалайзере на клиенте может совпасть с идентификатором сохранённым в истории
   // и мы по итогу получим некорректный результат
   // Для этого всегда создаём новый инстанс Serializer'a
   getSerialize: function () {
      return new Serializer();
   }
};

/**
 * A proxy that works only takes data from the history source
 * @class Controls/_history/FilterSource
 * @extends Core/core-extend
 * @mixes Types/_entity/OptionsToPropertyMixin
 * @control
 * @private
 * @author Герасимов А.М.
 * @category Menu
 * @example
 * <pre>
 *    var source = new filterSource({
 *           originSource: new Memory({
 *               keyProperty: 'id',
 *               data: []
 *           }),
 *           historySource: new historyService({
 *               historyId: 'TEST_FILTER_HISTORY_ID',
 *               dataLoaded: true
 *           })
 *       });
 * </pre>
 */

/**
 * @name Controls/_history/FilterSource#originSource
 * @cfg {Source} Источник данных.
 */

/*
 * @name Controls/_history/FilterSource#originSource
 * @cfg {Source} A data source
 */

/**
 * @name Controls/_history/FilterSource#historySource
 * @cfg {Source} Источник, который работает с историей.
 * @see {Controls/_history/Service} Источник, который работает с <a href="/doc/platform/developmentapl/middleware/input-history-service/">сервисом истории ввода</a>.
 */

/*
 * @name Controls/_history/FilterSource#historySource
 * @cfg {Source} A source which work with history
 * @see {Controls/_history/Service} Source working with the service of InputHistory
 */

var Source = CoreExtend.extend([entity.OptionsToPropertyMixin], {
   _history: null,
   _serialize: false,
   '[Types/_source/ICrud]': true,

   constructor: function Memory(cfg) {
      this.originSource = cfg.originSource;
      this.historySource = cfg.historySource;
   },

   create: function (meta) {
      return _private.getSourceByMeta(this, meta).create(meta);
   },

   read: function (key, meta) {
      return _private.getSourceByMeta(this, meta).read(key, meta);
   },

   update: function (data, meta) {
      var self = this;
      var serData, item;

      if (meta.hasOwnProperty('$_pinned')) {
         _private.updatePinned(this, data);
      }
      if (meta.hasOwnProperty('$_history')) {
         _private.updateRecent(this, data);
      }
      if (meta.hasOwnProperty('$_addFromData')) {
         item = _private.getHistoryItem(self, data);
         if (item) {
            meta = {
               '$_history': true
            };
            _private.updateRecent(this, item);
            _private.getSourceByMeta(this, meta).update(item, meta);
            return;
         }

         serData = JSON.stringify(data, _private.getSerialize(this).serialize);

         return _private.getSourceByMeta(this, meta).update(serData, meta).addCallback(function (dataSet) {
            _private.updateRecent(
               self,
               _private.getRawHistoryItem(self, dataSet.getRawData(), serData, item ? item.get('HistoryId') : self.historySource.getHistoryId())
            );
         });
      }
      return _private.getSourceByMeta(this, meta).update(data, meta);
   },

   destroy: function (keys, meta) {
      return _private.getSourceByMeta(this, meta).destroy(keys, meta);
   },

   query: function (query) {
      var self = this;
      var where = query.getWhere();
      var newItems;

      if (where && where['$_history'] === true) {
         return self.historySource.query().addCallback(function (data) {
            _private.initHistory(self, data);
            newItems = _private.getItemsWithHistory(self, self._history);
            self.historySource.saveHistory(self.historySource.getHistoryId(), self._history);
            return new sourceLib.DataSet({
               rawData: newItems.getRawData(),
               keyProperty: newItems.getIdProperty()
            });
         });
      }
      return self.originSource.query(query);
   },

   /**
    * Returns a set of items sorted by history
    * @returns {RecordSet}
    */
   getItems: function () {
      return _private.getItemsWithHistory(this, this._history);
   },

   /**
    * Returns a set of recent items
    * @returns {RecordSet}
    */
   getRecent: function () {
      return this._history.recent;
   },

   /**
    * Returns a deserialized history object
    * @returns {Object}
    */
   getDataObject: function (data) {
      return _private.deserialize(this, data);
   }
});

Source._private = _private;

export = Source;
