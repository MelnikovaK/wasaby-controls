/**
 * Created by cheremushkin iv on 19.01.2015.
 */
define('js!SBIS3.CONTROLS.SearchMixin', ['Core/helpers/functional-helpers'], function(fHelpers) {

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
         //Чтобы событие onReset не отправлялось непрерывно
         _onResetIsFired: true,
         _searchDelay: null,
         _options: {
            /**
             * @cfg {Number|null} количество символов, которые нужно ввести, чтоб начать поиск.
             * @remark
             * Если установить опцию в null, то поиск не будет запускаться автоматически.
             */
            startCharacter : 3,
            /**
             * @cfg {Number} временной интервал, который показывает с какой частотой бросать событие поиска
             */
            searchDelay : 500
         }
      },

      $constructor: function() {
         this._publish('onSearch','onReset');
      },

      after : {
         _setTextByKeyboard : function(text) {
            this._startSearch(text);
         },
         destroy : function() {
            this._clearSearchDelay();
         }
      },

      _startSearch: function(text) {
         this._clearSearchDelay();
         this._searchDelay = setTimeout(fHelpers.forAliveOnly(function () {
            this._applySearch(text);
         }, this), this._options.searchDelay);
      },

      _clearSearchDelay: function () {
        if(this._searchDelay) {
           clearTimeout(this._searchDelay);
           this._searchDelay = null;
        }
      },

      _applySearch : function(text, force) {
         var hasStartCharacter = this._options.startCharacter !== null,
             textTrimLength;

         /* Если поиск запущен, то надо отменить поиск с задержкой */
         this._clearSearchDelay();
         if (text) {
            /* Вырезаем символы < > только если они одиночные, т.е. не в составе какого-то слова,
               т.к. декоратор в гриде при выделении цветом одиночных < > может поломать вёрстку */
            text = text.replace(/^([<|>][\s])|([\s][<|>][\s])|([\s][<|>])$/g, '');
            textTrimLength = String.trim(text).length;
            if ( (hasStartCharacter && textTrimLength >= this._options.startCharacter) || (force && textTrimLength)) {
               this._notify('onSearch', text);
               this._onResetIsFired = false;
            } else if (hasStartCharacter) {
               this._notifyOnReset();
            }
         }
         else {
            this._notifyOnReset();
         }
      },

      _notifyOnReset: function() {
         if(!this._onResetIsFired) {
            this._notify('onReset');
            this._onResetIsFired = true;
         }
      },

      /**
       * Сбросить поиск
       * @see applySearch
       */
      resetSearch: function(){
         this.setText('');
         this.applySearch(true);
      },

      /**
       * Запустить поиск
       * @param {boolean} force Принудительный запуск поиска, даже если кол-во символов меньше чем {@link startCharacter}.
       * @see resetSearch
       */
      applySearch: function(force) {
         this._applySearch(this.getText(), force);
      }


   };

   return SearchMixin;

});