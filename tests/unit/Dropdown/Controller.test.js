define(
   [
      'Controls/Dropdown/Controller',
      'WS.Data/Source/Memory',
      'WS.Data/Collection/RecordSet'
   ],
   (Dropdown, Memory, RecordSet) => {
      describe('Dropdown/Controller', () => {
         let items = [
            {
               id: '1',
               title: 'Запись 1'
            },
            {
               id: '2',
               title: 'Запись 2'
            },
            {
               id: '3',
               title: 'Запись 3',
               icon: 'icon-16 icon-Admin icon-primary'
            },
            {
               id: '4',
               title: 'Запись 4'
            },
            {
               id: '5',
               title: 'Запись 5'
            },
            {
               id: '6',
               title: 'Запись 6'
            },
            {
               id: '7',
               title: 'Запись 7'
            },
            {
               id: '8',
               title: 'Запись 8'
            }
         ];

         let itemsRecords = new RecordSet({
            idProperty: 'id',
            rawData: items
         });

         let selectItem = null;

         let config = {
            selectedKeys: '[2]',
            keyProperty: 'id',
            emptyText: true,
            dataLoadCallback: function(items) {
               selectItem = items[0];
            },
            source: new Memory({
               idProperty: 'id',
               data: items
            })
         };

         let configLazyLoad = {
            lazyItemsLoad: true,
            selectedKeys: '[2]',
            keyProperty: 'id',
            source: new Memory({
               idProperty: 'id',
               data: items
            })
         };

         let getDropdownController = function(config) {
            let dropdownCntroller = new Dropdown(config);
            dropdownCntroller.saveOptions(config);
            return dropdownCntroller;
         };

         it('before mount', (done) => {
            let dropdownController = getDropdownController(config);
            dropdownController._beforeMount(config).addCallback(function(items) {
               assert.deepEqual(items.getRawData(), itemsRecords.getRawData());
               done();
            });
         });

         it('check received state', () => {
            let dropdownController = getDropdownController(config);
            dropdownController._beforeMount(config, null, itemsRecords);
            assert.deepEqual(dropdownController._items.getRawData(), itemsRecords.getRawData());
         });

         it('check selectedItemsChanged event', () => {
            let dropdownController = getDropdownController(config);
            dropdownController._items = itemsRecords;
            let selectedKeys,
               selectedItem;

            //subscribe на vdom компонентах не работает, поэтому мы тут переопределяем _notify
            //(дефолтный метод для vdom компонент который стреляет событием).
            //он будет вызван вместо того что стрельнет событием, тем самым мы проверяем что отправили
            //событие и оно полетит с корректными параметрами.
            dropdownController._notify = (e, args) => {
               if (e == 'selectedItemsChanged') {
                  selectedItem = args[0];
               }
            };
            Dropdown._private.selectItem.call(dropdownController, dropdownController._items.at(5));
            assert.deepEqual(selectedItem, dropdownController._items.at(5));
         });

         it('before update source', () => {
            let dropdownController = getDropdownController(config);
            items.push({
               id: '9',
               title: 'Запись 9'
            });
            dropdownController._selectedItems = [];
            dropdownController._items = itemsRecords;
            return new Promise((resolve) => {
               dropdownController._beforeUpdate({
                  selectedKeys: '[2]',
                  keyProperty: 'id',
                  source: new Memory({
                     idProperty: 'id',
                     data: items
                  })
               }).addCallback(() => {
                  assert.equal(dropdownController._items.getCount(), items.length);
                  resolve();
               });
            });
         });

         it('open dropdown', () => {
            let dropdownController = getDropdownController(config);
            dropdownController._items = itemsRecords;
            dropdownController._children.DropdownOpener = {
               close: setTrue.bind(this, assert),
               open: setTrue.bind(this, assert)
            };
            dropdownController._open();
         });

         it('notify footer click', () => {
            let dropdownController = getDropdownController(config);
            dropdownController._beforeMount(configLazyLoad);
            dropdownController._children.DropdownOpener = {
               close: setTrue.bind(this, assert),
               open: setTrue.bind(this, assert)
            };
            dropdownController._notify = (e) => {
               assert.equal(e, 'footerClick');
            };
            dropdownController._onResult({action: 'footerClick'});
         });

         it('check item click', () => {
            let dropdownController = getDropdownController(config);
            dropdownController._beforeMount(configLazyLoad);
            dropdownController._items = itemsRecords;
            dropdownController._children.DropdownOpener = {
               close: setTrue.bind(this, assert),
               open: setTrue.bind(this, assert)
            };
            dropdownController._notify = (e) => {
               assert.equal(e, 'selectedItemsChanged');
            };
            dropdownController._onResult({action: 'itemClick', data: [dropdownController._items.at(4)]});
         });
         it('open one item', () => {
            let dropdownController = getDropdownController(config);
            let item = new RecordSet({
               idProperty: 'id',
               rawData: [ {id: 1, title: 'Запись 1'} ]
            });
            dropdownController._items = item;
            dropdownController._notify = (e, data) => {
               assert.equal(e, 'selectedItemsChanged');
               assert.deepEqual(data[0], [item.at(0)]);
            };
            dropdownController._open();
         });

         it('lazy load', () => {
            let dropdownController = getDropdownController(configLazyLoad);
            dropdownController._beforeMount(configLazyLoad);
            assert.equal(dropdownController._items, undefined);
         });

         it('before update source lazy load', () => {
            let dropdownController = getDropdownController(configLazyLoad);
            dropdownController._beforeMount(configLazyLoad);
            items.push({
               id: '5',
               title: 'Запись 11'
            });
            dropdownController._beforeUpdate({
               lazyItemsLoad: true,
               selectedKeys: '[2]',
               keyProperty: 'id',
               source: new Memory({
                  idProperty: 'id',
                  data: items
               })
            });
            assert.equal(dropdownController._items, null);
         });

         it('before update new key', () => {
            let dropdownController = getDropdownController(config);
            dropdownController._selectedItems = [];
            dropdownController._items = itemsRecords;
            dropdownController._beforeUpdate({
               selectedKeys: '[6]',
               keyProperty: 'id'
            });
            assert.deepEqual(dropdownController._selectedItems[0].getRawData(), items[5]);
         });

         it('check empty item update', () => {
            let dropdownController = getDropdownController(config);
            dropdownController._selectedItems = [];
            Dropdown._private.updateSelectedItems(dropdownController, [null], 'id');
            assert.deepEqual(dropdownController._selectedItems, [null]);
         });

         it('open lazyLoad', () => {
            let dropdownController = getDropdownController(configLazyLoad);
            dropdownController._selectedItems = [];
            dropdownController._children.DropdownOpener = {
               close: setTrue.bind(this, assert),
               open: setTrue.bind(this, assert)
            };
            dropdownController._open();
         });

         function setTrue(assert) {
            assert.equal(true, true);
         }
      });
   });
