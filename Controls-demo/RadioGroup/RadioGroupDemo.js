
define('Controls-demo/RadioGroup/RadioGroupDemo', [
   'Core/Control',
   'tmpl!Controls-demo/RadioGroup/RadioGroupDemo',
   'WS.Data/Source/Memory',
   'tmpl!Controls-demo/RadioGroup/resources/RadioItemTemplate',
   'tmpl!Controls-demo/RadioGroup/resources/SingleItemTemplate',
   'tmpl!Controls-demo/RadioGroup/resources/UnionItemTemplate',
   'css!Controls-demo/RadioGroup/RadioGroupDemo'
], function (Control,
             template,
             MemorySource,
             CustomItemTemplate,
             SingleItemTemplate,
             UnionItemTemplate
) {
   'use strict';
   var source = new MemorySource({
         idProperty: 'id',
         displayProperty: 'caption',
         data: [
            {
               id: "1",
               title: 'Значение1',
               caption: 'caption1'
            },
            {
               id: "2",
               title: 'Значение2',
               caption: 'caption2'
            },
            {
               id: "3",
               title: 'Особенный',
               templateTwo: 'tmpl!Controls-demo/RadioGroup/resources/SingleItemTemplate',
               caption: 'caption3'
            },
            {
               id: "4",
               title: 'Значение4',
               caption: 'caption4'
            },
            {
               id: "5",
               title: 'Не такой как все',
               caption: 'caption5'
            },
            {
               id: "6",
               title: 'Значение6',
               caption: 'caption6'
            }
         ]
      });

   var RadioGroupDemo = Control.extend({
      _template: template,
      _customItemTemplate: CustomItemTemplate,
      _unionItemTemplate: UnionItemTemplate,
      _source: source,
      _selectKey: null,
      changeKey: function (e, key) {
         this._selectKey=key;
      }
   });
   return RadioGroupDemo;
});