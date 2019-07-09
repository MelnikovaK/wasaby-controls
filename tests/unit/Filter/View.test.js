define(
   [
      'Controls/filter',
      'Core/core-clone',
      'Types/source',
      'Types/collection'
   ],
   function(filter, Clone, sourceLib, collection) {
      describe('Filter:View', function() {

         let defaultItems = [
            [
               {id: 1, title: 'My'},
               {id: 2, title: 'My department'}
            ],

            [
               {id: 1, title: 'In any state'},
               {id: 2, title: 'In progress'},
               {id: 3, title: 'Completed'},
               {
                  id: 4,
                  title: 'Completed positive'
               },
               {
                  id: 5,
                  title: 'Completed negative'
               },
               {id: 6, title: 'Deleted'},
               {id: 7, title: 'Drafts'}
            ]
         ];

         let defaultSource = [
            {
               name: 'document',
               value: null,
               resetValue: null,
               textValue: '',
               emptyText: 'All documents',
               editorOptions: {
                  source: new sourceLib.Memory({
                     idProperty: 'id',
                     data: defaultItems[0]
                  }),
                  displayProperty: 'title',
                  keyProperty: 'id'
               },
               viewMode: 'frequent'
            }, {
               name: 'state',
               value: [1],
               resetValue: [null],
               textValue: '',
               emptyText: 'all state',
               editorOptions: {
                  source: new sourceLib.Memory({
                     idProperty: 'id',
                     data: defaultItems[1]
                  }),
                  displayProperty: 'title',
                  keyProperty: 'id',
                  multiSelect: true
               },
               viewMode: 'frequent'
            },
            {name: 'author', value: 'Ivanov K.K.', textValue: 'Author: Ivanov K.K.', resetValue: '', viewMode: 'basic'},
            {name: 'sender', value: '', resetValue: '', viewMode: 'extended', visibility: false},
            {name: 'responsible', value: '', resetValue: '', viewMode: 'extended', visibility: false}
         ];

         let defaultConfig = {
           source: defaultSource
         };

         let getView = function (config) {
            let view = new filter.View();
            view.saveOptions(config);
            return view;
         };

         it('_beforeMount from receivedState', function() {
            let view = getView(defaultConfig);
            let receivedState = {
               configs: {
                  document: {
                     items: Clone(defaultItems[0]),
                     displayProperty: 'title',
                     keyProperty: 'id'},
                  state: {
                     items: Clone(defaultItems[1]),
                     displayProperty: 'title',
                     keyProperty: 'id',
                     multiSelect: true}
               }
            };
            let expectedDisplayText = {
               document: {},
               state: {text: 'In any state', title: 'In any state', hasMoreText: ''}
            };
            view._beforeMount(defaultConfig, {}, receivedState);

            assert.deepStrictEqual(view._displayText, expectedDisplayText);
            assert.strictEqual(view._filterText, 'Author: Ivanov K.K.');
            assert.isOk(view._configs.document._sourceController);
            assert.isOk(view._configs.state._sourceController);
            assert.isFalse(view._hasSelectorTemplate);

            receivedState.configs.document.selectorTemplate = 'New Template';
            view._beforeMount(defaultConfig, {}, receivedState);
            assert.isTrue(view._hasSelectorTemplate);
         });

         it('_beforeMount from options', function(done) {
            let view = getView(defaultConfig);
            let expectedDisplayText = {
               document: {},
               state: {text: 'In any state', title: 'In any state', hasMoreText: ''}
            };
            view._beforeMount(defaultConfig).addCallback(function() {
               assert.deepStrictEqual(view._displayText, expectedDisplayText);
               assert.strictEqual(view._filterText, 'Author: Ivanov K.K.');
               assert.isOk(view._configs.document._sourceController);
               assert.isOk(view._configs.state._sourceController);
               done();
            });
         });

         it('_beforeUpdate', function(done) {
            let view = getView(defaultConfig);
            view._beforeUpdate(defaultConfig);

            let expectedDisplayText = {
               document: {text: 'My', title: 'My', hasMoreText: ''},
               state: {text: 'In any state', title: 'In any state', hasMoreText: ''}
            };

            let newConfig = Clone(defaultConfig);
            newConfig.source[0].value = 1;
            newConfig.source[0].editorOptions.source = new sourceLib.Memory({
               idProperty: 'id',
               data: defaultItems[0]
            });
            view._configs = {};
            view._displayText = {};
            view._beforeUpdate(newConfig).addCallback(function() {
               assert.deepStrictEqual(view._displayText, expectedDisplayText);
               done();
            });
         });

         it('_openDetailPanel', function() {
            let view = getView(defaultConfig),
               popupOptions;
            view._children = {
               DropdownOpener: { open: (options) => {popupOptions = options;}, isOpened: () => {return false;} }
            };
            view._container = {};
            view._options.detailPanelTemplateName = 'detailPanelTemplateName.wml';
            view._source = defaultConfig.source;

            view._openDetailPanel();

            assert.strictEqual(popupOptions.template, 'detailPanelTemplateName.wml');
            assert.strictEqual(popupOptions.templateOptions.items.length, 5);

            view._options.detailPanelTemplateName = null;
            view._openDetailPanel();
         });

         it('_openPanel', function() {
            let view = getView(defaultConfig),
               popupOptions;
            view._children = {
               DropdownOpener: { open: (options) => {popupOptions = options;}, isOpened: () => {return false;} }
            };
            view._container = {};
            view._options.panelTemplateName = 'panelTemplateName.wml';
            view._source = defaultConfig.source;
            view._configs = {
               document: {
                  items: Clone(defaultItems[0]),
                     displayProperty: 'title',
                     keyProperty: 'id'},
               state: {
                  items: Clone(defaultItems[1]),
                     displayProperty: 'title',
                     keyProperty: 'id',
                     multiSelect: true}
            };
            view._openPanel();

            assert.strictEqual(popupOptions.template, 'panelTemplateName.wml');
            assert.strictEqual(popupOptions.templateOptions.items.getCount(), 2);
         });

         it('_open', function() {
            let view = getView(defaultConfig),
               popupOptions,
               isOpened = true;
            view._children = {
               DropdownOpener: { open: (options) => {popupOptions = options;}, isOpened: () => {return isOpened;} }
            };
            view._container = {};

            view._open();
            assert.strictEqual(popupOptions, undefined);

            isOpened = false;
            view._open([1, 2, 4], {template: 'templateName'});

            assert.strictEqual(popupOptions.template, 'templateName');
            assert.deepStrictEqual(popupOptions.templateOptions.items, [1, 2, 4]);
         });

         it('_isFastReseted', function() {
            let view = getView(defaultConfig);
            view._source = defaultConfig.source;

            let isFastReseted = view._isFastReseted();
            assert.isFalse(isFastReseted);

            view._source = Clone(defaultConfig.source);
            view._source[1].value = view._source[1].resetValue;
            isFastReseted = view._isFastReseted();
            assert.isTrue(isFastReseted);
         });

         it('_reset', function() {
            let view = getView(defaultConfig),
               isOpened = true, closed,
               filterChanged, itemsChanged;
            view._children = {
               DropdownOpener: { isOpened: () => {return isOpened;}, close: () => {closed = true;} }
            };
            view._notify = (event, data) => {
              if (event === 'filterChanged') {
                 filterChanged = data[0];
              } else if (event === 'itemsChanged') {
                 itemsChanged = data[0];
              }
            };
            view._displayText = {};
            view._source = Clone(defaultConfig.source);
            view._configs = {
               document: {
                  items: Clone(defaultItems[0]),
                  displayProperty: 'title',
                  keyProperty: 'id'},
               state: {
                  items: Clone(defaultItems[1]),
                  displayProperty: 'title',
                  keyProperty: 'id',
                  multiSelect: true}
            };
            let item = view._source[1];
            view._reset('clearClick', item);
            assert.deepStrictEqual(item.value, [null]);
            assert.isTrue(closed);

            isOpened = false;
            item = view._source[1];
            view._reset('clearClick', item);
            assert.deepStrictEqual(item.value, [null]);
            assert.deepStrictEqual(filterChanged, {'author': 'Ivanov K.K.'});
            assert.deepStrictEqual(view._displayText, {document: {}, state: {}});
         });

         it('_resetFilterText', function() {
            let view = getView(defaultConfig),
               isOpened = true, closed,
               filterChanged, itemsChanged;
            view._children = {
               DropdownOpener: { isOpened: () => {return isOpened;}, close: () => {closed = true;} }
            };
            view._notify = (event, data) => {
               if (event === 'filterChanged') {
                  filterChanged = data[0];
               } else if (event === 'itemsChanged') {
                  itemsChanged = data[0];
               }
            };
            view._displayText = {};
            view._source = Clone(defaultConfig.source);
            view._configs = {
               document: {
                  items: Clone(defaultItems[0]),
                  displayProperty: 'title',
                  keyProperty: 'id'},
               state: {
                  items: Clone(defaultItems[1]),
                  displayProperty: 'title',
                  keyProperty: 'id',
                  multiSelect: true}
            };
            view._resetFilterText();
            assert.isTrue(closed);
            assert.strictEqual(view._source[2].value, '');
            assert.deepStrictEqual(filterChanged, {state: [1]});
            assert.deepStrictEqual(view._displayText, {document: {}, state: {text: 'In any state', title: 'In any state', hasMoreText: ''}});
         });

         it('_startTimer', function() {
            let opened, resultConfig;
            let view = getView(defaultConfig);
            view._options.panelTemplateName = 'panelTemplateName.wml';
            view._children = {
               DropdownOpener: { open: (config) => {
                  resultConfig = config;
                  opened = true;
               }},
               fast: 'target'
            };
            view._source = Clone(defaultConfig.source);
            view._configs = {
               document: {
                  items: Clone(defaultItems[0]),
                  displayProperty: 'title',
                  keyProperty: 'id'},
               state: {
                  items: Clone(defaultItems[1]),
                  displayProperty: 'title',
                  keyProperty: 'id',
                  multiSelect: true}
            };
            view._container = {};
            view._startTimer('mouseenter', {name: 'fast', title: 'My department'});
            setTimeout(() => {
               assert.isTrue(opened);
               assert.strictEqual(resultConfig.target, 'target');
            }, 110);
         });

         it('_rangeChangedHandler', () => {
            let source = [...defaultSource];
            let dateItem = {
               name: 'date',
               value: [new Date(2019, 7, 1), new Date(2019, 7, 31)],
               resetValue: [new Date(2019, 7, 1), new Date(2019, 7, 31)],
               editorOptions: {
                  option1: '1',
                  option2: '2'
               },
               editorName: 'dateRange',
               viewMode: 'basic'
            };
            source.push(dateItem);
            let view = getView(source),
               newFilter;
            view._notify = (event, data) => {
               if (event === 'filterChanged') {
                  newFilter = data[0];
               }
            };
            view._source = source;
            view._rangeChangedHandler('rangeChanged', new Date(2019, 6, 1), new Date(2019, 6, 31));
            assert.deepStrictEqual(filter.View._private.getDateRangeItem(view._source).value, [new Date(2019, 6, 1), new Date(2019, 6, 31)]);
            assert.deepStrictEqual(filter.View._private.getDateRangeItem(view._source).textValue, "Июль'19");
            assert.deepStrictEqual(newFilter, {
               date: [new Date(2019, 6, 1), new Date(2019, 6, 31)],
               author: 'Ivanov K.K.',
               state: [1]});
         });

         it('_private:getDateRangeItem', () => {
            let source = [...defaultSource];
            let dateItem = {
               name: 'date',
               value: [new Date(2019, 7, 1), new Date(2019, 7, 31)],
               resetValue: [new Date(2019, 7, 1), new Date(2019, 7, 31)],
               editorOptions: {
                  option1: '1',
                  option2: '2'
               },
               editorName: 'dateRange',
               viewMode: 'basic'
            };
            source.push(dateItem);
            let item = filter.View._private.getDateRangeItem(source);
            assert.deepStrictEqual(item, dateItem)
         });

         describe('View::resultHandler', function() {
            let view;
            beforeEach(function() {
               view = getView(defaultConfig);
               view._displayText = {};
               view._source = Clone(defaultConfig.source);
               view._configs = {
                  document: {
                     items: Clone(defaultItems[0]),
                     displayProperty: 'title',
                     keyProperty: 'id'},
                  state: {
                     items: Clone(defaultItems[1]),
                     displayProperty: 'title',
                     keyProperty: 'id',
                     multiSelect: true}
               };
               view._children = {
                  DropdownOpener: { close: () => {} }
               };
            });

            it('_resultHandler itemClick', function() {
               let filterChanged;
               view._notify = (event, data) => {
                  if (event === 'filterChanged') {
                     filterChanged = data[0];
                  }
               };
               let eventResult = {
                  action: 'itemClick',
                  id: 'state',
                  selectedKeys: [2]
               };
               view._resultHandler('resultEvent', eventResult);
               assert.deepStrictEqual(view._source[1].value, [2]);
               assert.deepStrictEqual(view._displayText, {document: {}, state: {text: 'In progress', title: 'In progress', hasMoreText: ''}});
               assert.deepStrictEqual(filterChanged, {'author': 'Ivanov K.K.', state: [2]});

               eventResult.selectedKeys = [null];
               view._resultHandler('resultEvent', eventResult);
               assert.deepStrictEqual(view._source[1].value, defaultSource[1].resetValue);
               assert.deepStrictEqual(view._displayText, {document: {}, state: {}});
               assert.deepStrictEqual(filterChanged, {'author': 'Ivanov K.K.'});
            });

            it('_resultHandler applyClick', function() {
               let filterChanged;
               view._notify = (event, data) => {
                  if (event === 'filterChanged') {
                     filterChanged = data[0];
                  }
               };
               let eventResult = {
                  action: 'applyClick',
                  selectedKeys: { state: [1, 2] }
               };
               view._resultHandler('resultEvent', eventResult);
               assert.deepStrictEqual(view._source[1].value, [1, 2]);
               assert.deepStrictEqual(view._displayText, {document: {}, state: {text: 'In any state', title: 'In any state, In progress', hasMoreText: ', еще 1'}});
               assert.deepStrictEqual(filterChanged, {'author': 'Ivanov K.K.', state: [1, 2]});
            });

            it('_resultHandler selectorResult', function() {
               let filterChanged;
               view._notify = (event, data) => {
                  if (event === 'filterChanged') {
                     filterChanged = data[0];
                  }
               };
               view._configs.state.items = new collection.RecordSet({
                  idProperty: 'id',
                  rawData: defaultItems[1]
               });
               let newItems = new collection.RecordSet({
                  idProperty: 'id',
                  rawData: [{id: 3, title: 'Completed'}, {id: 20, title: 'new item'}, {id: 28, title: 'new item 2'}]
               });
               let eventResult = {
                  action: 'selectorResult',
                  id: 'state',
                  data: newItems
               };
               view._resultHandler('resultEvent', eventResult);
               assert.deepStrictEqual(view._source[1].value, [3, 20, 28]);
               assert.deepStrictEqual(view._displayText, {document: {}, state: {text: 'new item', title: 'new item, new item 2, Completed', hasMoreText: ', еще 2'}});
               assert.deepStrictEqual(filterChanged, {'author': 'Ivanov K.K.', state: [3, 20, 28]});
            });

            it('_resultHandler filterDetailPanelResult', function() {
               let filterChanged;
               view._notify = (event, data) => {
                  if (event === 'filterChanged') {
                     filterChanged = data[0];
                  }
               };
               let eventResult = {
                  id: 'state',
                  items: [{id: 'author', value: '', textValue: 'Author: Ivanov K.K.', resetValue: '', viewMode: 'basic'},
                        {id: 'sender', value: 'Sander123', resetValue: '', viewMode: 'extended', visibility: false},
                        {id: 'responsible', value: '', resetValue: '', viewMode: 'extended', visibility: false}]
               };
               view._resultHandler('resultEvent', eventResult);
               assert.deepStrictEqual(view._source[1].value, 'Sander123');
               assert.deepStrictEqual(filterChanged, {'sender': 'Sander123'});
            });

            it('_onSelectorTemplateResult', function() {
               let filterChanged;
               view._notify = (event, data) => {
                  if (event === 'filterChanged') {
                     filterChanged = data[0];
                  }
               };
               view._configs.state.items = new collection.RecordSet({
                  idProperty: 'id',
                  rawData: defaultItems[1]
               });
               let newItems = new collection.RecordSet({
                  idProperty: 'id',
                  rawData: [{id: 3, title: 'Completed'}, {id: 20, title: 'new item'}, {id: 28, title: 'new item 2'}]
               });
               view._idOpenSelector = 'state';
               view._onSelectorTemplateResult('resultEvent', newItems);
               assert.deepStrictEqual(view._source[1].value, [3, 20, 28]);
               assert.deepStrictEqual(view._displayText, {document: {}, state: {text: 'new item', title: 'new item, new item 2, Completed', hasMoreText: ', еще 2'}});
               assert.deepStrictEqual(filterChanged, {'author': 'Ivanov K.K.', state: [3, 20, 28]});
            });
         });
      });
   }
);
