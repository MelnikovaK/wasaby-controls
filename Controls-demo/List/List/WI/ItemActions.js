define('Controls-demo/List/List/WI/ItemActions', [
   'Core/Control',
   'wml!Controls-demo/List/List/WI/resources/ItemActions'
], function(Control, template) {
   'use strict';

   return Control.extend({
      _template: template
   });
});
