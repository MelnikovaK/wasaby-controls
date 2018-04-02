/**
 * Created by dv.zuev on 02.02.2018.
 */
define('Controls/Application/Compatible', [
   'Core/Control',
   'Core/EventBus',
   'Core/RightsManager',
   'tmpl!Controls/Application/Compatible',
   'tmpl!Controls/Application/CompatibleScripts'
], function(Base,
            EventBus,
            rights,
            template) {
   'use strict';

   var ViewTemplate = Base.extend({
      _template: template,
      _wasPatched: false,
      _beforeMount: function(){
         var rightsInitialized = new Deferred();
         this._forceUpdate = function(){
            return;
         }
         if(typeof window !== 'undefined') {
            Constants.rights = true;
            var rights = RightsManager.getRights();
            if (rights instanceof Deferred) {
               rights.addCallback(function(rights) {
                  window.rights = rights;
                  rightsInitialized.callback();
               });
               return rightsInitialized;
            }
         }
      },
      _afterMount: function(){
         for (var i in this._children){
            this._children[i]._forceUpdate = function(){
               return;
            };
            this._children[i]._shouldUpdate = function(){
               return false;
            }
         }
         require(['Lib/StickyHeader/StickyHeaderMediator/StickyHeaderMediator'], function() {
            EventBus.globalChannel().notify('bootupReady', {error:''});
         })
      },
      _shouldUpdate: function(){
         return false;
      }
   });

   return ViewTemplate;
});