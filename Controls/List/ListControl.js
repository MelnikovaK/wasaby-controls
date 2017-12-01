define('js!Controls/List/ListControl', [
   'Core/Control',
   'tmpl!Controls/List/ListControl',
   'js!Controls/List/ListControl/ListViewModel',
   'js!Controls/List/resources/utils/DataSourceUtil',
   'WS.Data/Type/descriptor',
   'WS.Data/Source/ISource',
   'js!Controls/List/Controllers/PageNavigation',
   'Core/helpers/functional-helpers',
   'require',
   'js!Controls/List/Controllers/ScrollWatcher',
   'Core/helpers/functional-helpers',
   'css!Controls/List/ListControl/ListControl'
], function (Control,
             ListControlTpl,
             ListViewModel,
             DataSourceUtil,
             Types,
             ISource,
             PageNavigation,
             fHelpers,
             require,
             ScrollWatcher
 ) {
   'use strict';

   var _private = {
      createListModel: function(items, cfg) {
         return new ListViewModel ({
            items : items,
            idProperty: cfg.idProperty,
            displayProperty: cfg.displayProperty,
            selectedKey: cfg.selectedKey
         })
      },

      initNavigation: function(navOption, dataSource) {
         var navController;
         if (navOption && navOption.source == 'page') {
            navController = new PageNavigation(navOption.sourceConfig);
            navController.prepareSource(dataSource);
         }
         return navController;
      },

      paramsWithNavigation: function(params, navigCtrl, display, direction) {
         var navigParams = navigCtrl.prepareQueryParams(display, direction);
         params.limit = navigParams.limit;
         params.offset = navigParams.offset;
         //TODO фильтр и сортировка не забыть приделать
         return params;
      },

      paramsWithUserEvent: function(params, userParams) {
         params.filter = userParams['filter'] || params.filter;
         params.sorting = userParams['sorting'] || params.sorting;
         params.offset = userParams['offset'] || params.offset;
         params.limit = userParams['limit'] || params.limit;
         return params;
      },

      load: function(direction) {
         if (this._dataSource) {
            var def, queryParams,
               self = this;

            queryParams = {
               filter: this._filter,
               sorting: this._sorting,
               limit: undefined,
               offset: undefined
            };
            //модифицируем параметры через навигацию
            if (this._navigationController) {
               queryParams = _private.paramsWithNavigation(queryParams, this._navigationController, this._display, direction);
            }

            //позволяем модифицировать параметры юзеру
            var userParams = this._notify('onBeforeDataLoad', queryParams.filter, queryParams.sorting, queryParams.offset, queryParams.limit);
            if (userParams) {
               queryParams = _private.paramsWithUserEvent(queryParams, userParams);
            }

            def = DataSourceUtil.callQuery(this._dataSource, this._options.idProperty, queryParams.filter, queryParams.sorting, queryParams.offset, queryParams.limit)
               .addCallback(fHelpers.forAliveOnly(function (list) {
                  self._notify('onDataLoad', list);
                  if (direction == 'down') {
                     self._listModel.appendItems(list);
                  } else if (direction == 'up') {
                     self._listModel.prependItems(list);
                  } else { //без направления - это перезагрузка
                     //модели нет, если это первая загрузка и не были заданы items в компонента
                     if (!self._listModel) {
                        self._listModel = _private.createListModel(list, self._options);
                        self._forceUpdate();
                     }
                     else {
                        self._listModel.setItems(list);
                     }
                  }
                  if (self._navigationController) {
                     self._navigationController.calculateState(list, direction);
                  }



                  //TODO это кривой способ заставить пэйджинг пересчитаться. Передалть, когда будут готовы команды от Зуева
                  window.setTimeout(function(){
                     if (self._scrollPagingCtr) {
                        self._scrollPagingCtr.resetHeights();
                     }
                  }, 100);
                  return list;
               }, self))
               .addErrback(fHelpers.forAliveOnly(this._loadErrorProcess, self));
            this._loader = def;
         }
         else {
            throw new Error('Option dataSource is undefined. Can\'t reload view');
         }
      },



      scrollToEdge: function(direction) {
         var self = this;
         if (this._navigationController && this._navigationController.hasMoreData(direction)) {
            this._navigationController.setEdgeState(direction);
            _private.load.call(this).addCallback(function(){
               _private.scrollTo.call(self, direction == 'up' ? 0 : 100000000)
            });
         }
         else {
            _private.scrollTo.call(self, direction == 'up' ? 0 : 100000000)
         }
      },

      scrollTo: function(offset) {
         //TODO без скролл вотчера пока так
         this._container.closest('.ws-scrolling-content').get(0).scrollTop = offset;
      },

      createScrollWatcher: function(scrollContainer) {
         var
            self = this,
            children = this._children,
            triggers = {
               topListTrigger: children.topListTrigger,
               bottomListTrigger: children.bottomListTrigger,
               topLoadTrigger: children.topLoadTrigger,
               bottomLoadTrigger: children.bottomLoadTrigger
            },
            eventHandlers = {
               onLoadTriggerTop: function() {
                  self._scrollLoadMore('up');
               },
               onLoadTriggerBottom: function() {
                  self._scrollLoadMore('down');
               },
               onListTop: function() {
               },
               onListBottom: function() {
               }
            };

         return new ScrollWatcher ({
            triggers : triggers,
            scrollContainer: scrollContainer,
            loadOffset: this._loadOffset,
            eventHandlers: eventHandlers
         });
      }
   };

   //TODO
   /*
    Опции
    * dragEntity, dragEntityList, enabledMove, itemsDragNDrop - обсудить с Яриком, возможно будет достаточно события dragStart
    * resultsPosition, resultsText, resultsTpl - как настраивать
    * */


   /**
    * List Control
    * @class Controls/List/ListControl
    * @extends Controls/Control
    * @mixes Controls/interface/IItems
    * @mixes Controls/interface/IDataSource
    * @mixes Controls/interface/ISingleSelectable
    * @mixes Controls/interface/IPromisedSelectable
    * @mixes Controls/interface/IGroupedView
    * @control
    * @public
    * @category List
    */

   /**
    * @name Controls/List/ListControl#showContextMenu
    * @cfg {Boolean} Показывать ли контекстное меню при клике на правую кнопку мыши
    */

   /**
    * @name Controls/List/ListControl#itemEditTemplate
    * @cfg {Function} Шаблон редактирования строки
    */

   /**
    * @name Controls/List/ListControl#emptyTemplate
    * @cfg {Function} Шаблон отображения пустого списка
    */

   /**
    * @name Controls/List/ListControl#filter
    * @cfg {Object} Настройки фильтра
    */

   /**
    * @name Controls/List/ListControl#sorting
    * @cfg {Object} Настройки сортировки
    */

   /**
    * @typedef {String} ListNavigationSource
    * @variant position Описание
    * @variant offset Описание
    * @variant page Описание
    */

   /**
    * @typedef {String} ListNavigationView
    * @variant infinity Описание
    * @variant pages Описание
    * @variant demand Описание
    */

   /**
    * @typedef {Object} ListNavigationPositionSourceConfig
    * @property {String} field Описание
    * @property {String} direction Описание
    */

   /**
    * @typedef {Object} ListNavigationOffsetSourceConfig
    * @property {Number} limit Описание
    */

   /**
    * @typedef {Object} ListNavigationInfinityViewConfig
    * @property {String} pagingMode Описание
    */

   /**
    * @typedef {Object} ListNavigationPagesViewConfig
    * @property {Boolean} pagesCountSelector Описание
    */

   /**
    * @typedef {Object} ListNavigation
    * @property {ListNavigationSource} source Описание
    * @property {ListNavigationView} view Описание
    * @property {ListNavigationPositionSourceConfig|ListNavigationOffsetSourceConfig} sourceConfig Описание
    * @property {ListNavigationInfinityViewConfig|ListNavigationPagesViewConfig} viewConfig Описание
    */

   /**
    * @name Controls/List/ListControl#navigation
    * @property {ListNavigation} Настройки навигации
    */

   /**
    * @name Controls/List/ListControl#multiselect
    * @cfg {Boolean} Разрешен ли множественный выбор.
    */

   /**
    * @name Controls/List/ListControl#itemsActions
    * @cfg {Array} Операции над записью
    */

   /**
    * @name Controls/List/ListControl#loadItemsStrategy
    * @cfg {String} Стратегия действий с подгружаемыми в список записями
    * @variant merge Мержить, при этом записи с одинаковыми id схлопнутся в одну
    * @variant append Добавлять, при этом записи с одинаковыми id будут выводиться в списке
    */

   /**
    * Запускает создание записи
    * @function Controls/interface/IPromisedSelectable#beginAdd
    */

   /**
    * Запускает редактирование по месту
    * @function Controls/interface/IPromisedSelectable#beginEdit
    */

   /**
    * Завершает редактирование по месту без сохранения изменений
    * @function Controls/interface/IPromisedSelectable#cancelEdit
    */

   /**
    * Завершает редактирование по месту с сохранением изменений
    * @function Controls/interface/IPromisedSelectable#commitEdit
    */

   //TODO
   /**
    * Подумать
    *
    * тут главный вопрос в диалоге редактирования. что мы должны позвать при диалоге редактирования?
    * или при операциях над записью. там есть и удаление и перемещение. с помощью диалога редактирования можно
    * позвать "создать", значит добавление можно делать не только через редактирование по месту.
    * по сути это синхронизация рекордсета, которым владеет список и источника можно делать вызов
    * отдельными методами - это это расскрывать детали реализации Санников предлагал делать метод sync,
    * чтобы был более четкий контракт с экшеном диалога редактирования. но не совсем понятно как работать с
    * синком из операций над записью.
    *
    * Удаляет записи из источника данных по переданным идентификаторам элементов коллекции. Шляпа какая-то.
    * @function -#deleteRecords
    */

   /**
    * Перемещает переданные записи. Подумать.
    * @function Controls/interface/IPromisedSelectable#move
    */

   /**
    * Перезагружает набор записей представления данных с последующим обновлением отображения
    * @function Controls/interface/IPromisedSelectable#reload
    */

   /**
    * @event Controls/List/ListControl#onAfterBeginEdit Происходит после начала редактирования
    */

   /**
    * @event Controls/List/ListControl#onAfterEndEdit Происходит после окончания редактирования по месту
    */

   /**
    * @event Controls/List/ListControl#onBeginAdd Происходит перед созданием в списке нового элемента коллекции
    */

   /**
    * @event Controls/List/ListControl#onBeginDelete Происходит перед удалением записей
    */

   /**
    * @event Controls/List/ListControl#onBeginEdit Происходит перед началом редактирования
    */

   /**
    * @event Controls/List/ListControl#onBeginMove Происходит перед началом перемещения записей
    */

   /**
    * @event Controls/List/ListControl#onDataMerge Происходит перед добавлением загруженных записей в основной dataSet
    */

   /**
    * @event Controls/List/ListControl#onEndDelete Происходит после удаления записей
    */

   /**
    * @event Controls/List/ListControl#onEndEdit Происходит перед окончанием редактирования или добавления по месту
    */

   /**
    * @event Controls/List/ListControl#onEndMove Происходит после перемещения записей
    */

   //TODO
   /**
    * Вроде есть смена выделеной записи, пока спилим
    * @event -#onItemActivate Происходит при смене записи (активации) под курсором мыши
    */

   /**
    * @event Controls/List/ListControl#onItemClick Происходит при любом клике по записи
    */

   //TODO
   /**
    * в чем разница между dataLoad и dataMerge?
    * @event Controls/List/ListControl#onDataLoad Происходит при загрузке данных
    */

   var ListControl = Control.extend({
         _controlName: 'Controls/List/ListControl',
         _template: ListControlTpl,
         iWantVDOM: true,
         _isActiveByClick: false,

         _items: null,
         _itemsChanged: true,

         _dataSource: null,
         _loader: null,

         //TODO пока спорные параметры
         _filter: undefined,
         _sorting: undefined,

         _itemTemplate: null,

         _loadOffset: 100,

         constructor: function (cfg) {
            ListControl.superclass.constructor.apply(this, arguments);
            this._publish('onDataLoad');
         },

         /**
          * Load more data after reaching end or start of the list.
          *
          * @param direction 'up' | 'down'
          * @private*/
         _scrollLoadMore: function(direction) {
            //TODO нужна компенсация при подгрузке вверх

            if (this._navigationController && this._navigationController.hasMoreData(direction)) {
               _private.load.call(this, direction);
            }
         },

         _beforeMount: function(newOptions) {

            //TODO могут задать items как рекордсет, надо сразу обработать тогда навигацию и пэйджинг

            this._filter = newOptions.filter;
            if (newOptions.items) {
               this._items = newOptions.items;
               this._listModel = _private.createListModel(this._items, newOptions);
            }
            if (newOptions.dataSource) {
               this._dataSource = DataSourceUtil.prepareSource(newOptions.dataSource);
               this._navigationController = _private.initNavigation(newOptions.navigation, this._dataSource);
               if (!this._items) {
                  _private.load.call(this);
               }
            }
         },

         _afterMount: function() {
            ListControl.superclass._afterMount.apply(this, arguments);

            //Если есть подгрузка по скроллу и список обернут в скроллКонтейнер, то создаем ScrollWatcher
            if (this._options.navigation && this._options.navigation.source === 'page') {
               var scrollContainer = this._container.closest('.ws-scrolling-content');
               if (scrollContainer && scrollContainer.length) {
                  this._scrollWatcher = _private.createScrollWatcher.call(this, scrollContainer[0]);
               }
            }

            if (this._options.navigation && this._options.navigation.view == 'infinity') {
               //TODO кривое обращение к DOM
               scrollContainer = this._container.closest('.ws-scrolling-content');
               if (scrollContainer.length && this._options.navigation.viewConfig && this._options.navigation.viewConfig.pagingMode) {
                  var self = this;
                  require(['js!Controls/List/Controllers/ScrollPaging'], function (ScrollPagingController) {
                     self._scrollPagingCtr = new ScrollPagingController({
                        scrollContainer: scrollContainer.get(0),
                        mode: self._options.navigation.viewConfig.pagingMode
                     });

                     self._scrollPagingCtr.subscribe('onChangePagingCfg', function(e, pCfg){
                        self._pagingCfg = pCfg;
                        self._forceUpdate();
                     });

                     self._scrollPagingCtr.startObserve();
                  });
               }
            }
         },

         _beforeUpdate: function(newOptions) {

            //TODO могут задать items как рекордсет, надо сразу обработать тогда навигацию и пэйджинг

            if (newOptions.filter != this._options.filter) {
               this._filter = newOptions.filter;
            }

            if (newOptions.items && newOptions.items != this._options.items) {
               this._items = newOptions.items;
               this._listModel = _private.createListModel(this._items, newOptions);
            }

            if (newOptions.dataSource !== this._options.dataSource) {
               this._dataSource = DataSourceUtil.prepareSource(newOptions.dataSource);
               this._navigationController = _private.initNavigation(newOptions.navigation, this._dataSource);
               _private.load.call(this);
            }
            //TODO обработать смену фильтров и т.д. позвать релоад если надо
         },

         _beforeUnmount: function() {
            if (this._scrollWatcher) {
               this._scrollWatcher.destroy();
            }

            ListControl.superclass._beforeUnmount.apply(this, arguments);
         },


         _afterUpdate: function() {

         },

         __onPagingArrowClick: function(e, arrow) {
            if (this._scrollPagingCtr) {
               switch (arrow) {
                  case 'Next': this._scrollPagingCtr.scrollForward(); break;
                  case 'Prev': this._scrollPagingCtr.scrollBackward(); break;
                  case 'Begin': _private.scrollToEdge.call(this, 'up'); break;
                  case 'End': _private.scrollToEdge.call(this, 'down'); break;
               }
            }
         },
         //<editor-fold desc='DataSourceMethods'>
         reload: function() {
            _private.load.call(this);
         },

         destroy: function() {
            if (this._scrollPagingCtr) {
               this._scrollPagingCtr.destroy()
            }
            ListControl.superclass.destroy.apply(this, arguments);
         }
      });

   //TODO https://online.sbis.ru/opendoc.html?guid=17a240d1-b527-4bc1-b577-cf9edf3f6757
   /*ListControl.getOptionTypes = function getOptionTypes(){
    return {
    dataSource: Types(ISource)
    }
    };*/

   return ListControl;
});