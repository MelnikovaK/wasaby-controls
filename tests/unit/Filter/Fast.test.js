define(
   [
      'Controls/Filter/Fast',
      'WS.Data/Source/Memory',
      'Core/vdom/Synchronizer/resources/SyntheticEvent'
   ],
   function(FastData, Memory, SyntheticEvent) {
      describe('FastFilterVDom', function() {
         var items = [
            [{key: 0, title: 'все страны'},
               {key: 1, title: 'Россия'},
               {key: 2, title: 'США'},
               {key: 3, title: 'Великобритания'}
            ],

            [{key: 0, title: 'все жанры'},
               {key: 1, title: 'фантастика'},
               {key: 2, title: 'фэнтези'},
               {key: 3, title: 'мистика'}
            ]
         ];
         var source = [
            {
               id: 'first',
               value: 'Россия',
               resetValue: 'все страны',
               properties: {
                  keyProperty: 'title',
                  displayProperty: 'title',
                  source: {
                     module: 'WS.Data/Source/Memory',
                     options: {
                        data: items[0]
                     }
                  }
               }
            },
            {
               id: 'second',
               resetValue: 'фэнтези',
               value: 'фэнтези',
               properties: {
                  items: items[1],
                  keyProperty: 'title',
                  displayProperty: 'title'
               }
            },
            {
               id: 'third',
               value: 0,
               resetValue: 0,
               properties: {
                  keyProperty: 'key',
                  displayProperty: 'title',
                  filter: {
                     key: 0
                  },
                  source: {
                     module: 'WS.Data/Source/Memory',
                     options: {
                        data: items[0]
                     }
                  }
               }
            },            {
               id: 'fourth',
               value: 'все страны',
               resetValue: 'все страны',
               properties: {
                  keyProperty: 'title',
                  displayProperty: 'title',
                  source: {
                     module: 'WS.Data/Source/Memory',
                     options: {
                        data: items[0]
                     }
                  }
               }
            }
         ];

         var config = {};
         config.source = new Memory({
            idProperty: 'id',
            data: source
         });

         var fastData = new FastData(config);
         var isSelected = false,
            selectedKey,
            isFilterChanged;

         var configWithItems = {};
         configWithItems.items = source;
         var fastDataItems = new FastData(configWithItems);
         fastDataItems._beforeMount(configWithItems);

         fastData._notify = (e, args) => {
            if (e == 'selectedKeysChanged') {
               isSelected = true;
               selectedKey = args[0];
            } else {
               isFilterChanged = true;
            }
         };
         fastData._beforeMount(config);
         fastData._children.DropdownOpener = {
            close: setTrue.bind(this, assert),
            open: setTrue.bind(this, assert)
         };

         it('load config', function(done) {
            FastData._private.reload(fastData).addCallback(function() {
               FastData._private.loadItems(fastData, fastData._items.at(0), 0).addCallback(function() {
                  assert.deepEqual(fastData._configs[0]._items.getRawData(), items[0]);
                  done();
               });
            });
         });

         it('_beforeUpdate without items', function() {
            fastData._beforeUpdate({});
         });

         it('load config from items', function(done) {
            FastData._private.reload(fastDataItems).addCallback(function() {
               FastData._private.loadItems(fastData, fastData._items.at(0), 0).addCallback(function() {
                  assert.deepEqual(fastData._configs[0]._items.getRawData(), items[0]);
                  done();
               });
            });
         });

         it('load config from items with filter', function(done) {
            FastData._private.reload(fastDataItems).addCallback(function() {
               FastData._private.loadItems(fastData, fastData._items.at(2), 0).addCallback(function() {
                  assert.deepEqual(fastData._configs[0]._items.getRawData(), [{key: 0, title: 'все страны'}]);
                  done();
               });
            });
         });

         it('get filter', function(done) {
            FastData._private.reload(fastData).addCallback(function() {
               FastData._private.loadItems(fastData, fastData._items.at(0), 0).addCallback(function() {
                  var result = FastData._private.getFilter(fastData._items);
                  assert.deepEqual(result, {'first': fastData._items.at(0).get('value')});
                  done();
               });
            });
         });

         it('on result', function(done) {
            FastData._private.reload(fastData).addCallback(function() {
               FastData._private.loadItems(fastData, fastData._items.at(0), 0).addCallback(function() {
                  fastData.lastOpenIndex = 0;
                  isSelected = false;
                  isFilterChanged = false;
                  selectedKey = null;
                  fastData._onResult({data: [fastData._configs[0]._items.at(2)]});
                  assert.isTrue(isSelected);
                  assert.isTrue(isFilterChanged);
                  assert.equal(items[0][2].title, selectedKey);
                  done();
               });
            });
         });

         it('getText', function(done) {
            FastData._private.reload(fastData).addCallback(function() {
               FastData._private.loadItems(fastData, fastData._items.at(0), 0).addCallback(function(items) {
                  fastData._setText();
                  assert.equal(fastData._configs[0].text, 'США');
                  assert.equal(fastData._configs[1].text, 'фэнтези');
                  assert.equal(fastData._configs[2].text, 'все страны');
                  assert.equal(fastData._configs[3].text, 'все страны');
                  done();
               });
            });
         });

         it('reset', function(done) {
            FastData._private.reload(fastData).addCallback(function() {
               FastData._private.loadItems(fastData, fastData._items.at(0), 0).addCallback(function() {
                  fastData.lastOpenIndex = 0;
                  fastData._container = {children: []};
                  isSelected = false;
                  selectedKey = null;
                  fastData._reset(null, fastData._items.at(0), 0);
                  assert.isTrue(isSelected);
                  assert.equal(fastData._items.at(0).get('resetValue'), selectedKey);
                  done();
               });
            });
         });

         it('open dropdown', function() {
            var event = {target: {}};
            FastData._private.reload(fastData, fastData.sourceController).addCallback(function() {
               FastData._private.loadItems(fastData, fastData._items.at(0), 0).addCallback(function() {
                  fastData._open(new SyntheticEvent(null, event), fastData._items.at(0), 0);
               });
            });
         });

         function setTrue(assert) {
            assert.equal(true, true);
         }

      });
   });
