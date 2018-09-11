define(
   [
      'Controls/Toolbar',
      'WS.Data/Entity/Model',
      'WS.Data/Collection/RecordSet',
      'WS.Data/Source/Memory'
   ],
   (Toolbar, Model, RecordSet, Memory) => {
      describe('Toolbar', () => {
         let defaultItems = [
            {
               id: '1',
               title: 'Запись 1',
               parent: null,
               '@parent': null
            },
            {
               id: '2',
               title: 'Запись 2',
               parent: null,
               '@parent': true
            },
            {
               id: '3',
               title: 'Запись 3',
               icon: 'icon-medium icon-Doge icon-primary',
               parent: null,
               '@parent': null,
               showType: 2
            },
            {
               id: '4',
               title: 'Запись 4',
               parent: '2',
               '@parent': null,
               showType: 0
            }
         ];

         let records = new RecordSet({
            rawData: defaultItems
         });
         let config = {
            items: new Memory({
               idProperty: 'id',
               data: defaultItems
            }),
            parentProperty: 'parent',
            nodeProperty: '@parent'
         };
         let itemWithMenu = new Model({
            rawData: defaultItems[1]
         });
         let toolbar = new Toolbar(config);

         toolbar._notify = (e, data) => {
            assert.equal(data[0].id, 'myTestItem');
            assert.equal(e, 'itemClick');
         };
         toolbar._children.menuOpener = {
            close: setTrue.bind(this, assert),
            open: setTrue.bind(this, assert)
         };
         toolbar._children.popupTarget = {
            _container: 'target'
         };

         describe('publicMethod', function() {
            it('check received state', () => {
               toolbar._beforeMount(config, null, records);
               assert.equal(toolbar._items, records);
               assert.equal(!!toolbar._needShowMenu, true);
               assert.equal(toolbar._menuItems.getCount(), 3);
            });
            it('need show menu', function() {
               return new Promise((resolve) => {
                  toolbar._beforeMount({
                     keyProperty: 'id',
                     source: config.items
                  }).addCallback(() => {
                     assert.equal(!!toolbar._needShowMenu, true);
                     assert.equal(toolbar._menuItems.getCount(), 3);
                     assert.equal(toolbar._items.getCount(), defaultItems.length);
                     resolve();
                  });
               });
            });
            it('open menu', function() {
               toolbar._notify = (e) => {
                  assert.equal(e, 'menuOpened');
               };
               toolbar._children.menuOpener = {
                  close: setTrue.bind(this, assert),
                  open: setTrue.bind(this, assert)
               };
               toolbar._children.popupTarget = {
                  _container: 'target'
               };
               toolbar._showMenu();
            });
            it('click toolbar item', function() {
               let isNotify = false;
               toolbar._notify = (e) => {
                  assert.equal(e, 'itemClick');
                  isNotify = true;
               };
               toolbar._onItemClick({stopPropagation: () => {}}, {
                  id: 'myTestItem',
                  get: () => {}
               });
               assert.equal(isNotify, true);
            });
            it('click item with menu', function() {
               let isNotify = false;
               let eventString = '';
               toolbar._beforeMount(config, null, records);
               toolbar._notify = (e) => {
                  eventString += e;
                  isNotify = true;
               };
               toolbar._onItemClick({stopPropagation: () => {}}, itemWithMenu);
               assert.equal(eventString, 'menuOpeneditemClick');
               assert.equal(isNotify, true);
            });
            it('before update source', () => {
               defaultItems.push({
                  id: '10',
                  title: 'Запись 10'
               });
               return new Promise((resolve) => {
                  toolbar._beforeUpdate({
                     keyProperty: 'id',
                     source: new Memory({
                        idProperty: 'id',
                        data: defaultItems
                     })
                  });
                  toolbar._sourceController._loader.addCallback(() => {
                     assert.equal(toolbar._items.getCount(), defaultItems.length);
                     resolve();
                  });
               });
            });
            it('menu item click', () => {
               toolbar._notify = (e) => {
                  assert.equal(e, 'itemClick');
               };
               toolbar._onResult({action: 'itemClick', event: {name: 'event', stopPropagation: () => {}}, data: [itemWithMenu]});
            });
         });

         function setTrue(assert) {
            assert.equal(true, true);
         }
      });
   });
