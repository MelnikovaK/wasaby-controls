import Control = require('Core/Control');
import Deferred = require('Core/Deferred');
import template = require('wml!Controls/_popup/Previewer/PreviewerTemplate');
import Utils = require('View/Executor/Utils');
import 'Controls/Container/Async';

/**
 * @class Controls/_popup/Previewer/PreviewerTemplate
 */

      var PreviewerTemplate = Control.extend({
         _template: template,

         _beforeMount: function(options) {
            if (typeof window !== 'undefined' && this._needRequireModule(options.template)) {
               var def = new Deferred();
               require([options.template], def.callback.bind(def), def.callback.bind(def));
               return def;
            }
         },

         _needRequireModule: function(module) {
            return typeof module === 'string' && !Utils.RequireHelper.defined(module);
         },

         _sendResult: function(event) {
            this._notify('sendResult', [event], { bubbling: true });
         }
      });

      export = PreviewerTemplate;


