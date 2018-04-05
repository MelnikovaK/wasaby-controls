define('Controls/Input/Area', [
   'Controls/Input/Text',
   'Core/constants',
   /*'WS.Data/Type/descriptor',*/
   'Core/detection',
   'tmpl!Controls/Input/Area/Area',
   'Controls/Input/resources/InputHelper',

   'css!Controls/Input/Area/Area'
], function(Text,
            constants,
            /*types,*/
            detection,
            template,
            inputHelper) {

   'use strict';

   /**
    *
    * Многострочное поле ввода - это текстовое поле с автовысотой.
    * Данное поле может автоматически менять высоту в зависимости от количества введённой информации.
    * @class Controls/Input/Area
    * @extends Controls/Input/Text
    * @control
    * @public
    * @category Input
    * @author Степин Павел Владимирович
    * @demo Controls-demo/Input/Area/Area
    */

   /**
    * @name Controls/Input/Area#minLines
    * @cfg {Number} Минимальное количество строк
    */

   /**
    * @name Controls/Input/Area#maxLines
    * @cfg {Number} Максимальное количество строк
    */

   /**
    * @name Controls/Input/Area#newLineKey
    * @cfg {String} Сочетание клавиш, для перехода на новую строку
    * @variant enter По нажатию Enter
    * @variant ctrlEnter По нажатию Ctrl + Enter
    * @variant shiftEnter По нажатию Shift + Enter.
    */

   var _private = {

      setFakeAreaValue: function(self, value){
         self._children.fakeAreaValue.innerHTML = value;
      },

      /*
      * Обновляет наличие скролла, в зависимости от того, есть ли скролл на фейковой текст арии
      */
      updateHasScroll: function(self){
         var fakeArea = self._children.fakeArea;
         var needScroll = fakeArea.scrollHeight - fakeArea.clientHeight > 1;

         //Для IE, текст мы показываем из fakeArea, поэтому сдвинем скролл.
         if(needScroll && detection.isIE){
            fakeArea.scrollTop = self._children.realArea.scrollTop;
         }

         if(needScroll !== self._hasScroll){
            self._hasScroll = needScroll;
         }
      },

      /*
       * Updates area multiline
       */
      updateMultiline: function(self){
         var fakeArea = self._children.fakeArea;
         var fakeAreaWrapper = self._children.fakeAreaWrapper;
         //Will define the number of rows in Area by comparing fakeArea and her wrap heights
         self._multiline = fakeArea.clientHeight > fakeAreaWrapper.clientHeight;
      }
   };

   var Area = Text.extend({

      _template: template,

      _hasScroll: false,

      _caretPosition: null,

      _multiline: undefined,

      constructor: function(options) {
         Area.superclass.constructor.call(this, options);
         //'_multiline' is responsible for adding multi-line field classes to InputRender
         //Should be set before the component is mounted into DOM to avoid content jumps
         this._multiline = options.minLines > 1;
      },

      _afterMount: function(){
         Area.superclass._afterMount.apply(this, arguments);

         //Should calculate area height after mount
         _private.updateHasScroll(this);
         _private.updateMultiline(this);
         this._forceUpdate();
      },

      _beforeUpdate: function(newOptions) {
         Area.superclass._beforeUpdate.apply(this, arguments);
         _private.setFakeAreaValue(this, newOptions.value);
         _private.updateHasScroll(this);
         _private.updateMultiline(this);
      },

      _afterUpdate: function(oldOptions) {
         if ((oldOptions.value !== this._options.value) && this._caretPosition) {
            this._children['realArea'].setSelectionRange(this._caretPosition, this._caretPosition);
            this._caretPosition = null;
         }
      },

      _valueChangedHandler: function(e, value){
         _private.setFakeAreaValue(this, value);
         _private.updateHasScroll(this);
         _private.updateMultiline(this);
         this._notify('valueChanged', [value]);
      },

      _keyDownHandler: function(e){

         //В режиме newLineKey === 'ctrlEnter' будем эмулировать переход на новую строку в ручную
         if(e.nativeEvent.keyCode === constants.key.enter && this._options.newLineKey === 'ctrlEnter'){

            //Обычный enter прерываем
            if(!e.nativeEvent.shiftKey && !e.nativeEvent.ctrlKey){
               e.preventDefault();
            }

            //Вроде не очень хорошо. Но если хотим перенести на новую строку сами, придется вмешиваться.
            if(e.nativeEvent.ctrlKey){
               e.target.value += '\n';
               this._children.inputRender._inputHandler(e);
            }
         }

      },

      _scrollHandler: function(){
         _private.updateHasScroll(this);
      },

      paste: function(text) {
         this._caretPosition = inputHelper.pasteHelper(this._children['inputRender'], this._children['realArea'], text);
      }

   });

   Area.getDefaultOptions = function() {
      return {
         newLineKey: 'enter'
      };
   };

   //TODO раскомментировать этот блок + зависимость types когда полечат https://online.sbis.ru/opendoc.html?guid=1416c4da-b0e0-402b-9e02-a3885dc6cdb8
   /*Area.getOptionTypes = function() {
      return {
         minLines: types(Number),
         maxLines: types(Number),
         newLineKey: types(String).oneOf([
          'enter',
          'ctrlEnter'
         ])
      };
   };*/

   //For unit-tests
   Area._private = _private;

   return Area;

});