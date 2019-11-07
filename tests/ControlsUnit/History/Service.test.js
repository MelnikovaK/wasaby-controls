/* global assert */
define(['Controls/history', 'Core/Deferred', 'Env/Env'], (history, Deferred, Env) => {

   describe('Controls/history:Service', () => {

      it('query', () => {
         if (Env.constants.isServerSide) { return; }
         const service = new history.Service({historyId: 'testId'});
         const loadDeferred = new Deferred();

         service._historyDataSource = {call: () => loadDeferred};

         let queryDef = service.query();
         assert.isTrue(queryDef === loadDeferred);

         let nextQuery = service.query();
         let loadData, expectedData = 'test';
         service.saveHistory('testId', expectedData);
         nextQuery.addCallback((data) => {
            loadData = data;
         });
         loadDeferred.callback();
         assert.equal(loadData, expectedData);
      });

      it('destroy', () => {
         const service = new history.Service({ historyId: 'testId' });
         let methodName;
         let methodMeta;

         service._historyDataSource = {call: (method, meta) => {
            methodName = method;
            methodMeta = meta;
         }};


         service.destroy('test');

         assert.equal(methodName, 'Delete');
         assert.deepEqual(methodMeta, {
            params: {
               history_id: 'testId',
               object_id: 'test'
            }
         })
      });

   });

});