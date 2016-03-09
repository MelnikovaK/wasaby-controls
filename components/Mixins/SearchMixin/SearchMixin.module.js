/**
 * Created by cheremushkin iv on 19.01.2015.
 */
define('js!SBIS3.CONTROLS.SearchMixin', [], function() {

   /**
    * Миксин, добавляющий иконку
    * @mixin SBIS3.CONTROLS.SearchMixin
    * @public
    * @author Крайнов Дмитрий Олегович
    */

   var SearchMixin = /**@lends SBIS3.CONTROLS.SearchMixin.prototype  */{
      /**
       * @event onSearch При поиске
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {String} text Текст введенный в поле поиска
       */
      /**
       * @event onReset При нажатии кнопки отмена (крестик)
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       */
      $protected: {
         _curText: '',
         //Чтобы событие onReset не отправлялось непрерывно
         _onResetIsFired: true,
         _options: {
            /**
             * @cfg {Number} количество символов, которые нужно ввести, чтоб начать поиск
             */
            startCharacter : 3,
            /**
             * @cfg {Number} временной интервал, который показывает с какой частотой бросать событие поиска
             */
            searchDelay : 300
         }
      },

      $constructor: function() {
         this._publish('onSearch','onReset');
      },

      after : {
         setText : function(text) {
            this._startSearch(text);
         }
      },

      _startSearch: function(text) {
         var self = this;
         this._curText = text;
         window.setTimeout(function(){
            if (text == self._curText) {
               self._applySearch(text);
            }
         }, this._options.searchDelay);
      },

      _applySearch : function(text) {
         if (text) {
            text = String.trim(text.replace(/[<>]/g, ''));
            if (text.length >= this._options.startCharacter) {
               this._notify('onSearch', text);
            }
            this._onResetIsFired = false;
         }
         else {
            if (!this._onResetIsFired) {
               this._notify('onReset');
               this._onResetIsFired = true;
            }
         }
      }


   };

   return SearchMixin;

});