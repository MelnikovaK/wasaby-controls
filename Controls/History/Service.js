define('Controls/History/Service', [
   'Core/core-extend',
   'Types/entity',
   'Types/source',
   'Controls/History/Constants',
   'Core/Deferred',
   'Core/core-clone',
   'Core/constants'
], function(
   CoreExtend,
   entity,
   source,
   Constants,
   Deferred,
   coreClone,
   coreConstants
) {
   'use strict';

   /**
     * Source working with the service of InputHistory
     *
     * @class Controls/History/Service
     * @extends Types/entity:Abstract
     * @implements Types/source:ISource
     * @mixes Types/entity:OptionsToPropertyMixin
     * @public
     * @author Герасимов А.М.
     * @example
     * <pre>
     *    new historyService({
     *       historyId: 'TEST_HISTORY_ID'
     *    })
     * </pre>
     * @name Controls/MenuButton#historyId
     * @cfg {String} unique service history identifier
     *
     * @name Controls/MenuButton#historyIds
     * @cfg {Array of String} unique service history identifiers
     *
     * @name Controls/MenuButton#pinned
     * @cfg {Boolean} Loads pinned items from BL
     * @remark
     * true - Load items
     * false - No load items
     *
     * @name Controls/MenuButton#frequent
     * @cfg {Boolean} Loads frequent items from BL
     * @remark
     * true - Load items
     * false - No load items
     *
     * @name Controls/MenuButton#recent
     * @cfg {Boolean} Loads recent items from BL
     * @remark
     * true - Load items
     * false - No load items
     *
     * @name Controls/MenuButton#dataLoaded
     * @cfg {Boolean} Items loaded with object data
     * @remark
     * true - BL return items with data
     * false - BL return items without data
     *
     */

   var STORAGES = {};

   var STORAGES_USAGE = {};

   var _private = {
      getHistoryDataSource: function(self) {
         if (!self._historyDataSource) {
            self._historyDataSource = new source.SbisService({
               endpoint: {
                  address: '/input-history/service/',
                  contract: 'InputHistory'
               }
            });
         }
         return self._historyDataSource;
      },
      
      getMethodNameByIdType: function(stringMethod, intMethod, id) {
         return typeof id === 'number' ? intMethod : stringMethod;
      },

      updateHistory: function(self, data) {
         var id = data.getId();
         _private.getHistoryDataSource(self).call(_private.getMethodNameByIdType('Add', 'AddInt', id), {
            history_id: data.get('HistoryId') || self._historyId,
            id: id,
            history_context: null
         });
      },

      addFromData: function(self, data) {
         return _private.getHistoryDataSource(self).call('AddFromData', {
            history_id: self._historyId,
            data: data
         });
      },

      updatePinned: function(self, data, meta) {
         var id = data.getId();
         _private.getHistoryDataSource(this).call(_private.getMethodNameByIdType('SetPin', 'SetIntPin', id), {
            history_id: data.get('HistoryId') || self._historyId,
            id: id,
            history_context: null,
            pin: !!meta['$_pinned']
         });
      },

      incrementUsage: function(self) {
         if (!STORAGES_USAGE[self._historyId]) {
            STORAGES_USAGE[self._historyId] = 0;
         }
         STORAGES_USAGE[self._historyId]++;
      },

      decrementUsage: function(self) {
         STORAGES_USAGE[self._historyId]--;
         if (STORAGES_USAGE[self._historyId] === 0) {
            delete STORAGES[self._historyId];
         }
      }
   };

   var Service = CoreExtend.extend([source.ISource, entity.OptionsToPropertyMixin, entity.SerializableMixin], {
      _historyDataSource: null,
      _historyId: null,
      _historyIds: null,
      _pinned: null,
      _frequent: null,
      _dataLoaded: false,

      constructor: function Memory(cfg) {
         if (!('historyId' in cfg) && !('historyIds' in cfg)) {
            throw new Error('"historyId" not found in options.');
         }
         this._historyId = cfg.historyId;
         this._historyIds = cfg.historyIds;
         this._pinned = cfg.pinned;
         this._frequent = cfg.frequent;
         this._recent = cfg.recent;
         this._dataLoaded = cfg.dataLoaded;
      },

      update: function(data, meta) {
         if (meta.hasOwnProperty('$_addFromData')) {
            return _private.addFromData(this, data);
         }
         if (meta.hasOwnProperty('$_pinned')) {
            _private.updatePinned(this, data, meta);
         }
         if (meta.hasOwnProperty('$_history')) {
            _private.updateHistory(this, data, meta);
         }

         return {};
      },

      query: function() {
         var self = this;
         var getValueDef = new Deferred();

         if (!STORAGES[self._historyId] || coreConstants.isBuildOnServer) {
            getValueDef = _private.getHistoryDataSource(this).call('UnionMultiHistoryIndexesList', {
               params: {
                  historyIds: this._historyId ? [this._historyId] : this._historyIds,
                  pinned: {
                     count: this._pinned ? Constants.MAX_HISTORY : 0
                  },
                  frequent: {
                     count: this._frequent ? (Constants.MAX_HISTORY - Constants.MIN_RECENT) : 0
                  },
                  recent: {
                     count: this._recent || Constants.MAX_HISTORY
                  },
                  getObjectData: this._dataLoaded
               }
            });
         } else {
            getValueDef.callback(self.getHistory(self._historyId));
         }
         _private.incrementUsage(this);
         return getValueDef;
      },

      destroy: function() {
         _private.decrementUsage(this);
      },

      /**
       * Returns a service history identifier
       * @returns {String}
       */
      getHistoryId: function() {
         return this._historyId;
      },

      /**
       * Save new history
       */
      saveHistory: function(historyId, newHistory) {
         STORAGES[historyId] = coreClone(newHistory);
      },

      /**
       * Returns a set of history items
       * @returns {Object}
       */
      getHistory: function(historyId) {
         return STORAGES[historyId];
      }
   });

   return Service;
});
