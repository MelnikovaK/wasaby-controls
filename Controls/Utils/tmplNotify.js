define('Controls/Utils/tmplNotify', [], function() {

   'use strict';

   /**
    * A handler to use in templates to proxy events to the logic parent.
    */
   return function(event, eventName) {
      /**
       * We can't ignore bubbling events here, because no one guarantees they're the same.
       * E.g. on:myEvent="_tmplNotify('anotherEvent')"
       * Here, event gets forwarded but under a different name.
       */
      var args = Array.prototype.slice.call(arguments, 2);
      event.blockUpdate = true;

      return this._notify(eventName, args);
   };
});
