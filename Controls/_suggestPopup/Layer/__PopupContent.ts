
import BaseLayer from './__BaseLayer';
import template = require('wml!Controls/_suggestPopup/Layer/__PopupContent');
import 'css!theme?Controls/suggest';

var _private = {
   getBorderWidth: function(container) {
      return +getComputedStyle(container, null).getPropertyValue('border-left-width').replace('px', '') * 2;
   },
   getSuggestWidth: function(target, container) {
      return target.offsetWidth - _private.getBorderWidth(container);
   }
};

var __PopupContent = BaseLayer.extend({

   _template: template,
   _positionFixed: false,
   _popupOptions: null,
   _suggestWidth: null,
   _reverseList: false,

   _beforeUpdate: function(newOptions) {
      __PopupContent.superclass._beforeUpdate.apply(this, arguments);

      let reverseList = newOptions.stickyPosition && newOptions.stickyPosition.verticalAlign.side === 'top';

      if (!this._reverseList && reverseList) {
         this._children.scrollContainer.scrollToBottom();
      }

      this._reverseList = reverseList;
   },

   _afterUpdate: function(oldOptions) {
      //need to notify resize after show content, that the popUp recalculated its position
      if (this._options.showContent !== oldOptions.showContent) {
         this._notify('controlResize', [], {bubbling: true});
      }

      if (this._options.showContent && !this._positionFixed) {
         this._positionFixed = true;
         this._notify('sendResult', [this._options.stickyPosition], {bubbling: true});
      }
   },

   _afterMount: function() {
      // fix _options.target[0] || _options.target after https://online.sbis.ru/opendoc.html?guid=d7b89438-00b0-404f-b3d9-cc7e02e61bb3
      var target = this._options.target[0] || this._options.target;
      var container = this._container[0] || this._container;

      /* Width of the suggestion popup should setted for template from suggestTemplate option,
         this is needed to make it possible to set own width for suggestions popup by user of control.
         Than user can set own width:
         <Controls.suggest:Input>
            <ws:suggestTemplate>
               <Controls.suggestPopup:ListContainer/>     <---- here you can set the width by the class with min-width
            </ws:suggestTemplate>
         <Controls.suggest:Input/> */
      this._suggestWidth = _private.getSuggestWidth(target, container);
      this._forceUpdate();
   },

   resize: function() {
      if (this._reverseList) {
         this._children.scrollContainer.scrollToBottom();
      }
   }
});

__PopupContent._private = _private;

export default __PopupContent;
