/* global define, $ws */
define('js!SBIS3.CONTROLS.Data.Adapter.SbisRecord', [
   'js!SBIS3.CONTROLS.Data.Adapter.IRecord',
   'js!SBIS3.CONTROLS.Data.Adapter.SbisFormatMixin',
   'js!SBIS3.CONTROLS.Data.Adapter.FieldType'
], function (IRecord, SbisFormatMixin, FIELD_TYPE) {
   'use strict';

   /**
    * Адаптер для записи таблицы данных в формате СБиС
    * @class SBIS3.CONTROLS.Data.Adapter.SbisRecord
    * @mixes SBIS3.CONTROLS.Data.Adapter.IRecord
    * @mixes SBIS3.CONTROLS.Data.Adapter.SbisFormatMixin
    * @public
    * @author Мальцев Алексей
    */
   var SbisRecord = $ws.core.extend({}, [IRecord, SbisFormatMixin], /** @lends SBIS3.CONTROLS.Data.Adapter.SbisRecord.prototype */{
      _moduleName: 'SBIS3.CONTROLS.Data.Adapter.SbisRecord',

      //region SBIS3.CONTROLS.Data.Adapter.JsonFormatMixin

      addField: function(format, at) {
         SbisRecord.superclass.addField.call(this, format, at);
      },

      removeField: function(name) {
         SbisRecord.superclass.addField.call(this, name);
      },

      removeFieldAt: function(index) {
         SbisRecord.superclass.removeFieldAt.call(this, index);
      },

      //endregion SBIS3.CONTROLS.Data.Adapter.JsonFormatMixin

      //region Public methods

      has: function (name) {
         return this._getFieldIndex(name) >= 0;
      },

      get: function (name) {
         var index = this._getFieldIndex(name);
         return index >= 0 ? this._data.d[index] : undefined;
      },

      set: function (name, value) {
         var index = this._getFieldIndex(name);
         if (index < 0) {
            throw new ReferenceError('Property is not defined');
         }
         this._data.d[index] = value;
      },

      getFields: function () {
         var fields = [];
         for (var i = 0, count = this._data.s.length; i < count; i++) {
            fields.push(this._data.s[i].n);
         }
         return fields;
      },

      getInfo: function (name) {
         $ws.single.ioc.resolve('ILogger').log('SBIS3.CONTROLS.Data.Adapter.SbisRecord', 'Method getInfo() is deprecated and will be removed in 3.7.4. Use \'getFormat\' instead.');
         var index = this._getFieldIndex(name),
            meta = index >= 0 ? this._data.s[index] : undefined,
            fieldData = {meta: undefined, type: undefined};
         if (meta) {
            var type = this._getType(meta, this._data.d[index]);
            fieldData.meta = type.meta;
            fieldData.type = type.name;
         }
         return fieldData;
      },

      getKeyField: function () {
         var s = this._data.s,
            index;
         for (var i = 0, l = s.length; i < l; i++) {
            if (s[i].n[0] === '@') {
               index = i;
               break;
            }
         }
         if (index === undefined && s.length) {
            index = 0;
         }

         return index === undefined ? undefined : s[index].n;
      },

      //endregion Public methods

      //region Protected methods

      _getType: function (meta, value, key) {
         key = key || 't';
         var typeSbis = meta[key],
            type;
         if (typeof typeSbis === 'object') {
            return this._getType(typeSbis, value, 'n');
         }
         for (var fieldType in FIELD_TYPE) {
            if (typeSbis === FIELD_TYPE[fieldType]) {
               type = fieldType;
               break;
            }
         }
         var prepareMeta = this._prepareMetaInfo(type, $ws.core.clone(meta), value);
         return {
            name: type,
            meta: prepareMeta
         };
      },

      _prepareMetaInfo: function (type, meta, value) {
         switch (type) {
            case 'Identity':
               meta.separator = ',';
               meta.isArray = value instanceof Array;
               break;
            case 'Enum':
               meta.source = [];
               for (var index in  meta.s){
                  if (meta.s.hasOwnProperty(index)) {
                     meta.source[index] = meta.s[index];
                  }
               }
               break;
            case 'Money':
               meta.precision = meta.p;
               break;
            case 'Flags':
               meta.makeData = function (value) {
                  value = value || {};
                  var s = meta.s,
                     res = {};
                  for (var index in s) {//s - объект из бл вида {0:key, 1:key1 ...}
                     if (s.hasOwnProperty(index)) {
                        res[s[index]] = value[index];
                     }
                  }
                  return res;
               };
               break;
            case 'Array':
               var metaType = this._getType(meta);
               meta.elementsType = metaType.name;
               break;

         }
         return meta;
      }

      //endregion Protected methods
   });

   return SbisRecord;
});