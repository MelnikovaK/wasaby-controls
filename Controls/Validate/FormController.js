define('Controls/Validate/FormController',
   [
      'Core/Control',
      'wml!Controls/Validate/FormController',
      'Env/Env',
      'Core/ParallelDeferred'
   ],
   function(
      Base,
      template,
      Env,
      ParallelDeferred
   ) {
      'use strict';

      var Form = Base.extend({
         _template: template,
         constructor: function(cfg) {
            Form.superclass.constructor.call(this, cfg);
            this._validates = [];
         },
         onValidateCreated: function(e, control) {
            e.blockUpdate = true;
            this._validates.push(control);
         },
         onValidateDestroyed: function(e, control) {
            this._validates = this._validates.filter(function(validate) {
               return validate !== control;
            });
         },
         submit: function() {
            var parallelDeferred = new ParallelDeferred();

            // The infobox should be displayed on the first not valid field.
            this._validates.reverse();
            this._validates.forEach(function(validate) {
               if (!(validate._options && validate._options.readOnly)) {
                  var def = validate.validate();
                  parallelDeferred.push(def);
               }
            });

            // TODO: willl be fixed by https://online.sbis.ru/opendoc.html?guid=3432359e-565f-4147-becb-53e86cca45b5
            this._validates.reverse();
            var resultDef = parallelDeferred.done().getResult().addCallback(function(results) {
               var
                  key;

               // Walking through object with errors and focusing first not valid field.
               for (key in results) {
                  if (results[key]) {
                     this._validates[key].activate();
                     break;
                  }
               }
               return results;
            }.bind(this)).addErrback(function(e) {
               Env.IoC.resolve('ILogger').error('Form', 'Submit error', e);
               return e;
            });
            this._notify('registerPending', [resultDef, { showLoadingIndicator: true }], { bubbling: true });
            return resultDef;
         },
         setValidationResult: function() {
            this._validates.forEach(function(validate) {
               validate.setValidationResult(null);
            });
         },
         isValid: function() {
            var results = {}, i = 0;
            this._validates.forEach(function(validate) {
               results[i++] = validate.isValid();
            });
            return results;
         }
      });
      return Form;
   });
