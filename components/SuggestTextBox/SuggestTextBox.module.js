define('js!SBIS3.CONTROLS.SuggestTextBox', [
   'js!SBIS3.CONTROLS.TextBox',
   'js!SBIS3.CONTROLS.PickerMixin',
   'js!SBIS3.CONTROLS.SuggestMixin',
   'js!SBIS3.CONTROLS.ChooserMixin'
], function (TextBox, PickerMixin, SuggestMixin, ChooserMixin) {
   'use strict';

   function stopEvent(e) {
      e.stopPropagation();
      e.preventDefault();
   }

   /**
    * Поле ввода с автодополнением
    * @class SBIS3.CONTROLS.SuggestTextBox
    * @extends SBIS3.CONTROLS.TextBox
    * @mixes SBIS3.CONTROLS.PickerMixin
    * @mixes SBIS3.CONTROLS.SuggestMixin
    * @mixes SBIS3.CONTROLS.ChooserMixin
    * @control
    * @public
    * @category Inputs
    * @demo SBIS3.CONTROLS.Demo.MySuggestTextBox Поле ввода с автодополнением
    * @author Алексей Мальцев
    */
   var SuggestTextBox = TextBox.extend([PickerMixin, SuggestMixin, ChooserMixin], /** @lends SBIS3.CONTROLS.SuggestTextBox.prototype */ {
      $constructor: function () {
         this._options.observableControls.unshift(this);
         this.getContainer().addClass('controls-SuggestTextBox');
      },

      _getLoadingContainer : function() {
         return this.getContainer().find('.controls-TextBox__fieldWrapper');
      },

      /**
       * Блочим события поднятия служебных клавиш,
       * нужно в основном при использовании в редактировании по месту
       * @param e
       * @private
       */
      _keyUpBind: function(e) {
         SuggestTextBox.superclass._keyUpBind.apply(this, arguments);
         switch (e.which) {
            /* Чтобы нормально работала навигация стрелками и не случалось ничего лишнего,
             то запретим всплытие события */
            case $ws._const.key.down:
            case $ws._const.key.up:
            case $ws._const.key.enter:
               if(this.isPickerVisible()) {
                  this._list && this._list._keyboardHover(e);
                  stopEvent(e);
               }
               break;
            case $ws._const.key.esc:
               if(this.isPickerVisible()) {
                  this.hidePicker();
                  stopEvent(e);
               }
               break;
         }
      },

      _keyDownBind: function(e) {
         SuggestTextBox.superclass._keyDownBind.apply(this, arguments);

         /* Запрещаем всплытие enter по событию keyDown,
            т.к. Area тоже его слушает и закрывает floatArea */
         if(e.which === $ws._const.key.enter && this.isPickerVisible()) {
            stopEvent(e);
         }
      }
   });

   return SuggestTextBox;
});
