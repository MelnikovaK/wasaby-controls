/**
 * Created by kraynovdo on 01.11.2017.
 */
define('js!Controls/List/Paging', [
   'Core/Control',
   'tmpl!Controls/List/Paging/Paging',
   'css!Controls/List/Paging/Paging'
], function (BaseControl,
             template
   ) {
   'use strict';
   var ModuleClass = BaseControl.extend(
      {
         _template: template,
         _stateBegin: 'normal',
         _stateEnd: 'normal',
         _stateNext: 'normal',
         _statePrev: 'normal',

         constructor: function(cfg) {
            ModuleClass.superclass.constructor.apply(this, arguments);
            this._stateBegin = cfg.stateBegin || 'disabled';
            this._stateEnd = cfg.stateEnd || 'disabled';
            this._stateNext = cfg.stateNext || 'disabled';
            this._statePrev = cfg.statePrev || 'disabled';
         },

         _beforeMount: function(newOptions) {
            if (newOptions.showDigits) {
               this.__calcBtnStates(newOptions.selectedKey);
            }
         },

         _beforeUpdate: function(newOptions) {
            if (newOptions.showDigits) {
               this.__calcBtnStates(newOptions.selectedKey);
            }
            else {
               this._stateBegin = newOptions.stateBegin || 'disabled';
               this._stateEnd = newOptions.stateEnd || 'disabled';
               this._stateNext = newOptions.stateNext || 'disabled';
               this._statePrev = newOptions.statePrev || 'disabled';
            }
         },

         __calcBtnStates: function(selKey) {
            if (selKey <= 1) {
               this._stateBegin = 'disabled';
               this._statePrev = 'disabled';
            }
            else {
               this._stateBegin = 'normal';
               this._statePrev = 'normal';
            }

            if (selKey >= this._options.pagesCount) {
               this._stateEnd = 'disabled';
               this._stateNext = 'disabled';
            }
            else {
               this._stateEnd = 'normal';
               this._stateNext = 'normal';
            }
         },

         __digitClick: function(e, digit) {
            this.__changePage(digit);
         },

         __changePage: function(page) {
            if (this._options.selectedKey != page) {
               this._notify('onChangeSelectedKey', page);
            }
         },

         __arrowClick: function(e, btnName) {
            if(this['_state' + btnName] == 'normal') {
               if (this._options.showDigits) {
                  var targetPage;
                  switch (btnName) {
                     case 'Begin': targetPage = 1; break;
                     case 'End': targetPage = this._options.pagesCount; break;
                     case 'Prev': targetPage = this._options.selectedKey - 1; break;
                     case 'Next': targetPage = this._options.selectedKey + 1; break;
                  }
                  this.__changePage(targetPage);
               }
               this._notify('onArrowClick', btnName);
            }
         }
      });
   return ModuleClass;
});