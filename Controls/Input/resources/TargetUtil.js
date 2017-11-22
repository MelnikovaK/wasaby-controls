define('js!Controls/Input/resources/TargetUtil',
   [
      'Core/core-extend'
   ],
   function(coreExtend) {

      'use strict';

      var TargetUtil = coreExtend({

         saveSelectionPosition: function(target){
            this._selectionStart = target.selectionStart;
            this._selectionEnd = target.selectionEnd;
         },

         setValue: function(target, value, position){
            target.value = value;
            target.setSelectionRange(position, position);
         },

         /*Доработать*/
         buildSplitValue: function(target, oldValue){
            var newValue = target.value;
            var position = target.selectionEnd;

            if(!(this._selectionEnd - this._selectionStart) && this._selectionStart >= position){
               return {
                  beforeInputValue: newValue.substring(0, position),
                  inputValue: '',
                  afterInputValue: newValue.substring(position)
               }
            }
            else {
               var selectionLength = this._selectionEnd - this._selectionStart;
               var afterInputValue = newValue.substring(position);
               var beforeInputValue = oldValue.substring(0, oldValue.length - afterInputValue.length - selectionLength);
               var inputValue = newValue.substring(beforeInputValue.length, newValue.length - afterInputValue.length);

               return {
                  beforeInputValue: beforeInputValue,
                  inputValue: inputValue,
                  afterInputValue: afterInputValue
               };
            }
         }

      });

      return TargetUtil;
   }
);