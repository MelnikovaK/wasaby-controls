define('Controls-demo/Buttons/BackButton/BackButtonDemoPG',
   [
      'Core/Control',
      'tmpl!Controls-demo/PropertyGrid/DemoPG',
      'json!Controls-demo/PropertyGrid/pgtext',

      'css!Controls-demo/Filter/Button/PanelVDom',
      'css!Controls-demo/Input/resources/VdomInputs',
      'css!Controls-demo/Wrapper/Wrapper'
   ],

   function(Control, template, config) {
      'use strict';
      var BackButtonDemo = Control.extend({
         _template: template,
         _metaData: null,
         _content: 'Controls/heading:Back',
         _dataObject: null,
         _componentOptions: null,
         _beforeMount: function() {
            this._dataObject = {
               style: {
                  keyProperty: 'id',
                  displayProperty: 'title',
                  selectedKey: 0
               },
               size: {
                  keyProperty: 'id',
                  displayProperty: 'title',
                  selectedKey: 1
               },
               showClickEvent: true
            };
            this._componentOptions = {
               size: 'm',
               caption: 'Back',
               style: 'secondary',
               name: 'BackButton',
               tooltip: ''

            };
            this._metaData = config[this._content].properties['ws-config'].options;
         }
      });
      return BackButtonDemo;
   });
