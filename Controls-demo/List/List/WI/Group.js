define('Controls-demo/List/List/WI/Group', [
   'Core/Control',
   'wml!Controls-demo/List/List/WI/resources/Group'
], function(Control, template) {
   'use strict';

   return Control.extend({
      _template: template
   });
});
