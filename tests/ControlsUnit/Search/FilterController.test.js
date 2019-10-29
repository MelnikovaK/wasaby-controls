define(['Controls/search'], function(search) {
   describe('Controls/search:FilterController', function() {
      it('_beforeMount with option searchValue', () => {
         var filterController = new search.FilterController();

         filterController._beforeMount({
            searchParam: 'title',
            searchValue: 'test'
         });

         assert.deepEqual(filterController._filter, { title: 'test' });

         filterController._filter = null;
         filterController._beforeMount({
            searchValue: 'test'
         });
         assert.deepEqual(filterController._filter, {});
      });
      it('_beforeUpdate', () => {
         var filterController = new search.FilterController();
         filterController.saveOptions({
            filter: { title: 'test' }
         });

         filterController._beforeUpdate({
            filter: {
               title: 'test2'
            }
         });

         assert.deepEqual(filterController._filter, { title: 'test2' });
      });
   });
});
