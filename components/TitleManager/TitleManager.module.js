/*global define, $ws, $*/
define('js!SBIS3.CONTROLS.TitleManager', [
   'Core/Abstract'
], function(cAbstract) {
   'use strict';
   /**
    * Синглтон, который управляет заголовком страницы, он хранит контролы и заголовки, при уничтожении контрола
    * он устанавливает предыдущий заголовок из стека.
    * @class SBIS3.CONTROLS.TitleManager
    * @public
    * @author Крайнов Дмитрий Олегович
    */
   var TitleManager = cAbstract.extend(/**@lends SBIS3.CONTROLS.TitleManager.prototype*/{
      $protected: {
         _store: [],
         _defaultTitle: "/СБИС"
      },
      /**
       * Устанавливает title
       * @param {String} title Заголовок
       * @param {SBIS3.CONTROLS.Control} control Контрол на время жизни которого нужно установить заголовок
       */
      set: function (title, control) {
         var index = this._getIndexById(control.getId());
         if (this._store.length === 0 && document.title != this._defaultTitle) {
            this._defaultTitle = document.title;
         }
         if (index > -1) {
            this._store[index].title = title;
         } else {
            this._store.push({'title' : title, id: control.getId ()});
         }
         var self = this;
         control.subscribe('onDestroy', function() {
            self._onDestroyHandler(this.getId());
         });
         this._setDocumentTitle();
      },

      removeLastState: function () {
         this._store.splice(this._store.length-1, 1);
         this._setDocumentTitle();
      },

      _onDestroyHandler: function (id) {
         var index = this._getIndexById(id),
            current = this._store.splice(index, 1);
         if (current.length > 0 && current[0].title === document.title) {//если заголовок изменился ни чего не делаем
            this._setDocumentTitle();
         }
      },

      _getIndexById: function (id) {
         for (var i = this._store.length -1; i >=0; i--) {
            if (this._store[i].id == id) {
               return i;
            }
         }
         return -1;
      },

      _setDocumentTitle: function () {
         if (this._store.length > 0) {
            document.title = this._store[this._store.length-1].title;
         } else {
            document.title = this._defaultTitle;
         }
      }
   });

   return new TitleManager();
});