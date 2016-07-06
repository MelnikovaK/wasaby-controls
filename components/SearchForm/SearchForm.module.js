define('js!SBIS3.CONTROLS.SearchForm', [
   'js!SBIS3.CONTROLS.TextBox',
   'js!SBIS3.CONTROLS.SearchMixin',
   'js!SBIS3.CONTROLS.SuggestMixin',
   'js!SBIS3.CONTROLS.SuggestTextBoxMixin',
   'js!SBIS3.CONTROLS.PickerMixin',
   'html!SBIS3.CONTROLS.SearchForm',
   'html!SBIS3.CONTROLS.SearchForm/resources/SearchFormButtons'
], function (TextBox, SearchMixin, SuggestMixin, SuggestTextBoxMixin, PickerMixin, dotTplFn, buttonsTpl) {

   'use strict';

   /**
    * Cтрока поиска, поле ввода + кнопка поиска.
    * @class SBIS3.CONTROLS.SearchForm
    * @extends SBIS3.CONTROLS.TextBox
    * @mixes SBIS3.CONTROLS.SearchMixin
    * @public
    * @control
    * @demo SBIS3.CONTROLS.Demo.MySearchForm
    * @author Крайнов Дмитрий Олегович
    */

   var SearchForm = TextBox.extend([SearchMixin, PickerMixin, SuggestMixin, SuggestTextBoxMixin],/** @lends SBIS3.CONTROLS.SearchForm.prototype */ {
      /**
       * @event onSearch При нажатии кнопки поиска
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       * @param {String} text Текст введенный в поле поиска
       */
      /**
       * @event onReset При нажатии кнопки отмена (крестик)
       * @param {$ws.proto.EventObject} eventObject Дескриптор события.
       */
      _dotTplFn : dotTplFn,
      $protected: {
         _options: {
            afterFieldWrapper: buttonsTpl,
            /**
             * @cfg {String} Текст на кнопке поиска
             * @example
             * <pre>
             *     <option name="btnCaption">Найти</option>
             * </pre>
             * @translatable
             */
            btnCaption: '',
            usePicker: false
         }
      },

      $constructor:function () {
         var self = this;

         this.subscribe('onTextChange', function(e, text) {
            $('.js-controls-SearchForm__reset', self.getContainer().get(0)).toggleClass('ws-hidden', text == '');
         });

         $('.js-controls-SearchForm__reset', this.getContainer().get(0)).click(function() {
            self.resetSearch();
         });

         $('.js-controls-SearchForm__search', this.getContainer().get(0)).click(function() {
            if(self.isEnabled()) {
               self.applySearch(true);
            }
         });
      },

      /**
       * Обработчик поднятия клавиши
       * @private
       */
      _keyUpBind:function(event) {
         if (event.which === $ws._const.key.enter) {
            if (this._options.usePicker && this.isPickerVisible()) {
               SearchForm.superclass._keyUpBind.apply(this, arguments);
            } else {
               this.applySearch(true);
            }
            event.stopPropagation();
         } else {
            SearchForm.superclass._keyUpBind.apply(this, arguments);
         }
      },

      _onListItemSelect: function() {
         SearchForm.superclass._onListItemSelect.apply(this, arguments);
         this.applySearch(true);
      },

      _startSearch: function() {
         if (!this._options.usePicker) {
            SearchForm.superclass._startSearch.apply(this, arguments);
         }
      },

      /**
       * Обработчик нажатия клавиши
       * @private
       */
      _keyDownBind: function(e) {
         SearchForm.superclass._keyDownBind.apply(this, arguments);
         if (e.which === $ws._const.key.enter) {
            e.stopPropagation();
            e.preventDefault();
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
   });

   return SearchForm;
});