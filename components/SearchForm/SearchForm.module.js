define('js!SBIS3.CONTROLS.SearchForm', [
   'js!SBIS3.CONTROLS.TextBox',
   'html!SBIS3.CONTROLS.SearchForm',
   'html!SBIS3.CONTROLS.SearchForm/resources/SearchFormButtons'
], function (TextBox, dotTplFn, buttonsTpl) {

   'use strict';

   /**
    * Cтрока поиска, поле ввода + кнопка поиска.
    * @class SBIS3.CONTROLS.SearchForm
    * @extends SBIS3.CONTROLS.TextBox
    * @public
    * @control
    * @author Крайнов Дмитрий Олегович
    */

   var SearchForm = TextBox.extend(/** @lends SBIS3.CONTROLS.SearchForm.prototype */ {
      /**
       * @event onSearchStart При нажатии кнопки поиска
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
             */
            btnCaption: '',
            /**
             * @cfg {String} Подсказка в поле ввода
             * @example
             * <pre>
             *     <option name="placeholder">Введите ФИО полностью</option>
             * </pre>
             */
            placeholder: ''
         }
      },

      $constructor: function () {
         var self = this;

         this._publish('onSearchStart','onReset');

         this.subscribe('onTextChange', function(e, text) {
            if (text == '') {
               $('.js-controls-SearchForm__reset', self.getContainer().get(0)).hide();
            } else {
               $('.js-controls-SearchForm__reset', self.getContainer().get(0)).show();
            }
         });
         $('.js-controls-SearchForm__reset', this.getContainer().get(0)).click(function() {
            self.resetSearch();
         });
         $('.js-controls-SearchForm__search', this.getContainer().get(0)).click(function() {
            self.applySearch();
         });
      },

      /**
       * Начать поиск с тем текстом, что введен
       * @see resetSearch
       */
      applySearch: function() {
         this._notify('onSearchStart', this.getText());
      },

      /**
       * Сбросить поиск
       * @see applySearch
       */
      resetSearch: function(){
         $('.js-controls-SearchForm__reset', this.getContainer().get(0)).hide();
         this.setText('');
         this._notify('onReset');
      }
   });

   return SearchForm;
});