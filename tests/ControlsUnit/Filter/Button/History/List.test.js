define(
   [
      'Controls/_filterPopup/History/List',
      'Core/Serializer',
      'Types/chain',
      'ControlsUnit/Filter/Button/History/testHistorySource',
      'Controls/filter'
   ],
   function(List, Serializer, chain, HistorySourceDemo, filter) {
      describe('FilterHistoryList', function() {
         var items2 = [
            {id: 'period', value: [3], resetValue: [1], textValue: 'Past month'},
            {id: 'state', value: [1], resetValue: [1]},
            {id: 'limit', value: [1], resetValue: '', textValue: 'Due date', visibility: false},
            {id: 'sender', value: '', resetValue: '', visibility: false},
            {id: 'author', value: 'Ivanov K.K.', textValue: 'Ivanov K.K.', resetValue: ''},
            {id: 'responsible', value: '', resetValue: '', visibility: false},
            {id: 'tagging', value: '', resetValue: '', textValue: 'Marks', visibility: false},
            {id: 'operation', value: '', resetValue: '', visibility: false},
            {id: 'group', value: [1], resetValue: '', visibility: false},
            {id: 'unread', value: true, resetValue: false, textValue: 'Unread', visibility: false},
            {id: 'loose', value: true, resetValue: '', textValue: 'Loose', visibility: false},
            {id: 'own', value: [2], resetValue: '', textValue: 'On department', visibility: false},
            {id: 'our organisation', value: '', resetValue: '', visibility: false},
            {id: 'document', value: '', resetValue: '', visibility: false},
            {id: 'activity', value: [1], resetValue: '', selectedKeys: [1], visibility: false}
         ];

         var items1 = [
            {id: 'period', value: [3], resetValue: [1], textValue: 'Past month'},
            {id: 'state', value: [1], resetValue: [1]},
            {id: 'limit', value: [1], resetValue: '', textValue: 'Due date', visibility: true},
            {id: 'sender', value: '', resetValue: '', textValue: 'Petrov B.B', visibility: true},
            {id: 'author', value: 'Ivanov K.K.', textValue: 'Ivanov K.K.', resetValue: ''},
            {id: 'responsible', value: '', resetValue: '', visibility: false},
            {id: 'tagging', value: '', resetValue: '', textValue: 'Marks', visibility: false},
            {id: 'operation', value: '', resetValue: '', visibility: false},
            {id: 'group', value: [1], resetValue: '', visibility: false},
            {id: 'unread', value: true, resetValue: false, textValue: 'Unread', visibility: true},
            {id: 'loose', value: true, resetValue: '', textValue: 'Loose', visibility: false},
            {id: 'own', value: [2], resetValue: '', textValue: 'On department', visibility: true},
            {id: 'our organisation', value: '', resetValue: '', visibility: false},
            {id: 'document', value: '', resetValue: '', visibility: false},
            {id: 'activity', value: [1], resetValue: '', selectedKeys: [1], visibility: false}
         ];

         var itemsHistory = [items1, items2];

         var list = new List();

         var config = {
            historyId: 'TEST_HISTORY_ID'
         };

         var items = [
            {id: 'period', value: [2], resetValue: [1], textValue: 'Today'},
            {id: 'sender', value: '', resetValue: '', textValue: ''},
            {id: 'author', value: 'Ivanov K.K.', resetValue: '', textValue: 'Ivanov K.K.', visibility: true},
            {id: 'responsible', value: '', resetValue: '', textValue: 'Petrov T.T.', visibility: false}
         ];

         after(() => {
            list.destroy();
         });

         filter.HistoryUtils.loadHistoryItems('TEST_HISTORY_ID').addCallback(function(items) {
            config.items = items;
            config.filterItems = items;
         });

         list.saveOptions(config);

         it('get text', function() {
            var textArr = [];
            list._beforeMount(config);
            textArr = list._getText(list._options.items, items, filter.HistoryUtils.getHistorySource(config.historyId));
            assert.equal(textArr[0], 'Past month, Due date, Ivanov K.K., Unread, On department');
            assert.equal(textArr[1], 'Past month, Ivanov K.K.');

         });

         it('on resize', function() {
            var updated;
            list._forceUpdate = function() {
               updated = true;
            };
            List._private.onResize(list);
            assert.isTrue(list._isMaxHeight);
            assert.isTrue(updated);

            updated = false;
            List._private.onResize(list);
            assert.isFalse(updated);
         });

         it('click separator', function() {
            list._isMaxHeight = true;
            list._clickSeparatorHandler();
            assert.isFalse(list._isMaxHeight);
         });

         it('content click', function() {
            var histItems = [];
            list._notify = (e, args) => {
               if (e == 'applyHistoryFilter') {
                  histItems = args[0];
               }
            };
            var savedList = list;
            chain.factory(list._options.items).each(function(item, index) {
               if (item) {
                  savedList._contentClick('click', item);
                  assert.deepEqual(histItems, itemsHistory[index]);
               }
            });
         });

         it('pin click', function() {
            var savedList = list;
            chain.factory(list._options.items).each(function(item) {
               if (item) {
                  savedList._onPinClick('click', item);
               }
            });
         });

         it('_private::getResetValues', function() {
            var filterItems = [
               {id: 'period', value: [2], resetValue: [1], textValue: 'Today'},
               {id: 'sender', value: '', resetValue: 'test_sender', textValue: ''},
               {id: 'author', value: 'Ivanov K.K.', resetValue: true, textValue: 'Ivanov K.K.', visibility: true},
               {id: 'responsible', value: '', resetValue: '', textValue: 'Petrov T.T.', visibility: false}
            ];
            var resetValues = List._private.getResetValues(filterItems);
            assert.deepEqual(resetValues, {
               'period': [1],
               'sender': 'test_sender',
               'author': true,
               'responsible': ''
            });
         });


         it('_private::getStringHistoryFromItems', function() {
            let resetValues = {
               'period': [1],
               'sender': 'test_sender',
               'author': '',
               'responsible': ''
            };
            let historyItems = [
               {name: 'period', value: [2], textValue: 'Today'},
               {name: 'sender', value: '', textValue: ''},
               {name: 'author', value: 'Ivanov K.K.', textValue: 'Ivanov K.K.', visibility: true},
               {name: 'responsible', value: '', textValue: 'Petrov T.T.', visibility: false}
            ];
            let historyString = List._private.getStringHistoryFromItems(historyItems, resetValues);
            assert.strictEqual(historyString, 'Today, Ivanov K.K.');
         });
      });
   });
