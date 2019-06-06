define(['Controls/search'], function(searchMod) {

   describe('Controls/_search/Input/Container', function() {

      it('_beforeUpdate', function() {
         var cont = new searchMod.InputContainer();
         cont.saveOptions({});
         cont._value = '';

         cont._beforeUpdate({inputSearchValue: 'test'});
         assert.equal(cont._value, 'test');
      });

      it('_notifySearch', function() {
         var cont = new searchMod.InputContainer();
         var notifyed = false;
         cont._notify = function(eventName, args) {
            if (eventName === 'search' && args[1]) {
               notifyed = true;
            }
         };
         cont._notifySearch('', true);
         assert.isTrue(notifyed);
      });

      it('_searchClick', function() {
         var cont = new searchMod.InputContainer();
         var notifyed = false;
         cont._notify = function(eventName, args) {
            if (eventName === 'search' && args[1]) {
               notifyed = true;
            }
         };
         cont._searchClick();
         assert.isTrue(notifyed);
      });

   });

});
