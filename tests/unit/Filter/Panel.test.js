define(
   [
      'Controls/Filter/Button/Panel',
      'WS.Data/Collection/RecordSet'
   ],
   function(FilterPanel, RecordSet) {
      describe('FilterPanelVDom', function() {
         var template = 'tmpl!Controls-demo/Layouts/SearchLayout/FilterButtonTemplate/filterItemsTemplate';
         var config = {},
            items = [
               {
                  id: 'list',
                  value: 1,
                  resetValue: 1,
                  visibility: true
               },
               {
                  id: 'text',
                  value: '123',
                  resetValue: '',
                  visibility: true
               },
               {
                  id: 'bool',
                  value: true,
                  resetValue: false,
                  visibility: false
               }
            ];
         config.items = items;
         config.itemTemplate = template;
         config.additionalTemplate = template;

         var panel = new FilterPanel(config);
         panel._options = config;
         var isNotifyClose,
            filter;

         panel._notify = (e, args) => {
            if (e == 'close') {
               isNotifyClose = true;
            } else if (e == 'sendResult') {
               filter = args[0]['filter'];
            }
         };

         it('Init', function() {
            panel._beforeMount(config);
            assert.deepEqual(panel._items, config.items);
            assert.isTrue(panel._isChanged);
         });

         it('before update', function() {
            panel._items[2].visibility = false;
            panel._beforeMount(config);
            panel._beforeUpdate(config);
            assert.isTrue(panel._isChanged);
            assert.isTrue(panel._hasAdditionalParams);
         });

         it('apply', function() {
            isNotifyClose = false;
            panel._beforeMount(config);
            panel._applyFilter();
            assert.deepEqual({text: '123'}, filter);
            assert.isTrue(isNotifyClose);
         });

         it('apply history filter', function() {
            panel._beforeMount(config);
            panel._applyHistoryFilter();
            assert.deepEqual({text: '123'}, filter);
         });

         it('reset and filter', function() {
            panel._beforeMount(config);
            panel._resetFilter();
            assert.deepEqual({}, FilterPanel._private.getFilter(panel));
            assert.isFalse(panel._isChanged);
         });

         it('isChangeValue', function() {
            panel._beforeMount(config);
            panel._resetFilter();
            assert.isFalse(FilterPanel._private.isChangedValue(panel._items));
         });

         it('without add params', function() {
            panel._beforeMount(config);
            panel._items[2].visibility = true;
            assert.isFalse(FilterPanel._private.hasAdditionalParams(panel._items));
         });

         it('recordSet', function() {
            var rs = new RecordSet({
                  idProperty: 'id',
                  rawData: items
               }),
               options = {};
            options.items = rs;
            options.additionalTemplate = template;
            var panel2 = new FilterPanel(options);
            panel2._beforeMount(options);
            panel2._beforeUpdate(options);
            assert.isTrue(panel2._isChanged);
            assert.isTrue(panel2._hasAdditionalParams);
         });

         it('valueChanged, visibilityChanged', function() {
            panel._beforeMount(config);
            panel._valueChangedHandler();
            assert.deepEqual(panel._items, config.items);

            panel._visibilityChangedHandler();
            assert.deepEqual(panel._items, config.items);
         });

      });
   });
