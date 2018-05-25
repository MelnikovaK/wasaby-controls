define('Controls-demo/Decorators/Decorators',
   [
      'Core/Control',
      'tmpl!Controls-demo/Decorators/Decorators',

      'Controls-demo/Decorators/Money/Money',
      'Controls-demo/Decorators/Number/Number',
      'Controls-demo/Decorators/WrapURLs/WrapURLs',
      'css!Controls-demo/Decorators/Decorators'
   ],
   function(Control, template) {

      'use strict';

      return Control.extend({
         _template: template
      })
   }
);