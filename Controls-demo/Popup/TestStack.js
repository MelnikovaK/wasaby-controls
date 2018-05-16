define('Controls-demo/Popup/TestStack',
   [
      'Core/Control',
      'tmpl!Controls-demo/Popup/TestStack',
      'SBIS3.CONTROLS/Action/List/OpenEditDialog',
      'WS.Data/Entity/Record',
      'require'
   ],
   function (Control, template, OpenEditDialog, Record, require) {
      'use strict';

      var TestDialog = Control.extend({
         _template: template,

         _close: function(){
            this._notify('close', [], {bubbling: true});
         },

         _onClick: function(){
            if( this._options.type === 'sticky' ){
               this._notify('sendResult', [123], {bubbling: true});
            }
            else{
               this._children.stack.open({
                  maxWidth: 600
               });
            }
         },
         _openOldPanel: function (event, tplName, mode, isStack) {
            require([tplName], function () {
               new OpenEditDialog().execute({
                  template: tplName,
                  mode: mode,
                  initializingWay: 'local',
                  item: new Record(),
                  dialogOptions: {
                     isStack: isStack
                  }
               });
            });
         }
      });

      return TestDialog;
   }
);