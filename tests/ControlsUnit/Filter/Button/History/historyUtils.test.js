define(
   [
      'Controls/filter',
      'Controls/history',
      'Env/Env',
      'Types/collection',
      'Types/source'
   ],
   function(filter, history, Env, collection, sourceLib) {
      describe('Filter.Button.HistoryUtils', function() {

         var historyId = 'TEST_HISTORY_ID_UTILS';

         it('getHistorySource', function() {
            var hSource = filter.HistoryUtils.getHistorySource({historyId: historyId});
            assert.isTrue(hSource instanceof history.FilterSource);
            var hSource2 = filter.HistoryUtils.getHistorySource({historyId: historyId});
            assert.isTrue(hSource === hSource2);
         });

         it('getHistorySource isBuildOnServer', function() {
            var isBuildOnServer = Env.constants.isBuildOnServer;
            Env.constants.isBuildOnServer = true;
            var hSource = filter.HistoryUtils.getHistorySource({historyId: historyId});
            var hSource2 = filter.HistoryUtils.getHistorySource({historyId: historyId});
            assert.isTrue(hSource !== hSource2);
            Env.constants.isBuildOnServer = isBuildOnServer;
         });


         it('prependNewItems', function() {
            let initItems = [
               { key: 0, title: 'все страны' },
               { key: 1, title: 'Россия' },
               { key: 2, title: 'США' },
               { key: 3, title: 'Великобритания' }
            ];
            let hasMoreData = true;
            let items = new collection.RecordSet({
                  keyProperty: 'key',
                  rawData: initItems,
                  metaData: {test: true}
               }),
               sourceController = { hasMoreData: () => {return hasMoreData;} },
               source = new sourceLib.Memory({
                  keyProperty: 'key',
                  data: initItems
               });
            let newItems = new collection.RecordSet({
               keyProperty: 'key',
               rawData: [{ key: 18, title: '18 record' }]
            });
            let expectedItems = [{ key: 18, title: '18 record' }].concat(initItems.slice(0, 3));

            let resultItems = filter.HistoryUtils.getItemsWithHistory(items, newItems, sourceController, source);
            assert.equal(resultItems.getCount(), 4);
            assert.deepStrictEqual(resultItems.getRawData(), expectedItems);
            assert.deepStrictEqual(resultItems.getMetaData(), {test: true});

            newItems = new collection.RecordSet({
               keyProperty: 'key',
               rawData: [{ key: 20, title: '20 record' }, {key: 1, title: 'Россия'}]
            });
            expectedItems = [{ key: 20, title: '20 record' }, {key: 1, title: 'Россия'}].concat(initItems.slice(0, 1));
            resultItems = filter.HistoryUtils.getItemsWithHistory(items, newItems, sourceController, source, 'key');
            assert.equal(resultItems.getCount(), 3);
            assert.deepStrictEqual(resultItems.getRawData(), expectedItems);
         });

         it('isHistorySource', function() {
            let origSource = new sourceLib.Memory({
               keyProperty: 'key',
               data: []
            });
            let hSource = new history.Source({
               originSource: origSource,
               historySource: new history.Service({
                  historyId: 'TEST'
               })
            });

            assert.isTrue(filter.HistoryUtils.isHistorySource(hSource));
            assert.isFalse(filter.HistoryUtils.isHistorySource(origSource));

         });
      });
   });
