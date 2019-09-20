define('Controls-demo/Popup/Opener/StackIndent',
   [
      'Core/Control',
      'wml!Controls-demo/Popup/Opener/StackIndent',
      'wml!Controls-demo/Popup/Opener/resources/footer',
      'wml!Controls-demo/Popup/Opener/DialogTpl',
      'css!Controls-demo/Popup/PopupPageOld',
      'css!Controls-demo/Popup/Opener/resources/StackHeaderIndent'
   ],
   function(Control, template) {
      'use strict';

      var PopupPage = Control.extend({
         _template: template,
         openStack: function() {
            this._children.stack.open({
               opener: this._children.button1,
               closeOnOutsideClick: true,
               template: 'Controls-demo/Popup/Opener/resources/StackTemplate',
               width: 600
            });
         },
         openModalStack: function() {
            this._children.stack.open({
               opener: this._children.button4,
               modal: true,
               template: 'Controls-demo/Popup/Opener/resources/StackTemplate',
               width: 600
            });
         },
         openMaximizedStack: function() {
            this._children.stack.open({
               opener: this._children.button2,
               minimizedWidth: 600,
               minWidth: 600,
               width: 600,
               maxWidth: 800,
               template: 'Controls-demo/Popup/Opener/resources/StackTemplate',
               templateOptions: {
                  maximized: true,
                  maximizedButtonVisibility: true
               }
            });
         },
         openStackCustomHeader: function() {
            this._children.stack.open({
               opener: this._children.button6,
               width: 800,
               template: 'Controls-demo/Popup/Opener/resources/StackTemplateHeader',
            });
         },
         openStackWithoutHead: function() {
            this._children.stack.open({
               opener: this._children.button7,
               width: 800,
               template: 'Controls-demo/Popup/Opener/resources/StackTemplateWithoutHead',
            });
         }
      });
      return PopupPage;
   });
