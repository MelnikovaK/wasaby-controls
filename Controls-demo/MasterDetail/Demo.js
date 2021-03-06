define('Controls-demo/MasterDetail/Demo', [
   'Core/Control',
   'wml!Controls-demo/MasterDetail/Demo',
   'Controls-demo/MasterDetail/Data',
   'Core/core-clone',
   'Types/source',
   'wml!Controls-demo/MasterDetail/itemTemplates/masterItemTemplate',
   'Controls-demo/MasterDetail/DemoSource',
   'Env/Env',
   'css!Controls-demo/MasterDetail/Demo'
], function(Control, template, data, cClone, source, itemTemplate, DemoSource, Env) {
   return Control.extend({
      _template: template,


      _beforeMount: function() {
         this._detail = {};

         this._detailSource = new DemoSource({keyProperty: 'id'});

         this._itemActions = [
            {
               id: 1,
               icon: 'icon-ExpandDown',
               title: 'view',
               handler: function(item) {
                  Env.IoC.resolve('ILogger').info('action view Click ', item);
               }
            }
         ];

         this._masterSource = new source.Memory({
            keyProperty: 'id',
            data: cClone(data.master)
         });
      },

      gridColumns: [
         {
            displayProperty: 'name',
            width: '1fr',
            template: itemTemplate
         }
      ]
   });
});
