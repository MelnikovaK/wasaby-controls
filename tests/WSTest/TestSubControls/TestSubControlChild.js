define('js!WSTest/TestSubControls/TestSubControlChild',
   [
      'js!WSControls/Control/Base',
      'tmpl!WSTest/TestSubControls/TestSubControlChild'
   ],
   function(Base, template) {

      'use strict';

      var TestSubControlChild = Base.extend({
         _template: template,
         constructor: function(cfg) {
            TestSubControlChild.superclass.constructor.call(this, cfg);
         }
      });

      return TestSubControlChild;
   }
)