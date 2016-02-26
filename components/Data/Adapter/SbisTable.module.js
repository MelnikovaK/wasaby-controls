/* global define, $ws */
define('js!SBIS3.CONTROLS.Data.Adapter.SbisTable', [
   'js!SBIS3.CONTROLS.Data.Adapter.ITable',
   'js!SBIS3.CONTROLS.Data.Adapter.SbisFormatMixin'
], function (ITable, SbisFormatMixin) {
   'use strict';

   /**
    * Адаптер для таблицы данных в формате СБиС
    * @class SBIS3.CONTROLS.Data.Adapter.SbisTable
    * @mixes SBIS3.CONTROLS.Data.Adapter.ITable
    * @mixes SBIS3.CONTROLS.Data.Adapter.SbisFormatMixin
    * @public
    * @author Мальцев Алексей
    */
   var SbisTable = $ws.core.extend({}, [ITable, SbisFormatMixin], /** @lends SBIS3.CONTROLS.Data.Adapter.SbisTable.prototype */{
      _moduleName: 'SBIS3.CONTROLS.Data.Adapter.SbisTable',

      //region SBIS3.CONTROLS.Data.Adapter.JsonFormatMixin

      _buildD: function(value) {
         return $ws.helpers.map(this._data.s, function() {
            return value;
         });
      },

      //endregion SBIS3.CONTROLS.Data.Adapter.JsonFormatMixin

      //region Public methods

      getCount: function () {
         return this._data.d.length;
      },

      add: function (record, at) {
         if (!this._data.s.length) {
            this._data.s = record.s || [];
         }
         if (at === undefined) {
            this._data.d.push(record.d);
         } else {
            this._checkRowIndex(at);
            this._data.d.splice(at, 0, record.d);
         }
      },

      at: function (index) {
         return this._data.d[index] ? {
            d: this._data.d[index],
            s: this._data.s
         } : undefined;
      },

      remove: function (at) {
         this._checkRowIndex(at);
         this._data.d.splice(at, 1);
      },

      replace: function (record, at) {
         this._checkRowIndex(at);
         if (!this._data.s.length) {
            this._data.s = record.s || [];
         }
         this._data.d[at] = record.d;
      },

      move: function(source, target) {
         if (target === source) {
            return;
         }
         var removed = this._data.d.splice(source, 1);
         this._data.d.splice(target, 0, removed.shift());
      },

      merge: function(acceptor, donor){
         $ws.core.merge(
            this._data.d[acceptor],
            this._data.d[donor]
         );
         this.remove(donor);
      },

      copy: function(index){
         this._checkRowIndex(index);
         var source = this._data.d[index],
            clone = $ws.core.clone(source);
         this._data.d.splice(index, 0, clone);
      },

      //endregion Public methods

      //region Protected methods

      _checkRowIndex: function(index) {
         var max = this._data.d.length - 1;
         if (!(index >= 0 && index <= max)) {
            throw new RangeError(this._moduleName + ': row index ' + index + ' is out of bounds.');
         }
      }

      //endregion Protected methods

   });

   return SbisTable;
});