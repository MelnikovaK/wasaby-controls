define('js!Controls/Validate/FormController',
   [
      'Core/Control',
      'tmpl!Controls/Validate/FormController',
      'Core/IoC',
      'Core/ParallelDeferred'
   ],
   function(
      Base,
      template,
      IoC,
      ParallelDeferred
   ){
      'use strict';

      var Form = Base.extend({
         _template: template,

         constructor: function(cfg) {
            Form.superclass.constructor.call(this, cfg);
            this._validates = [];
         },
         onValidateCreated: function(e, control) {
            this._validates.push(control);
            e.stopPropagation();
         },
         onValidateDestroyed: function(e, control) {
            this._validates = this._validates.filter(function (validate) {
               return validate !== control;
            });
            e.stopPropagation();
         },
         submit: function() {
            var parallelDeferred = new ParallelDeferred();
            this._validates.forEach(function (validate) {
               var def = validate.validate();
               parallelDeferred.push(def);
            });
            return parallelDeferred.done().getResult().addCallback(function(results) {
               return results;
            }.bind(this)).addErrback(function (e) {
               IoC.resolve('ILogger').error('Form', 'Submit error', e);
            });
         }
      });
      return Form;
   }
);