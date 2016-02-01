/**
 * Created by iv.cheremushkin on 14.08.2014.
 */

define('js!SBIS3.CONTROLS.ListView',
   [
      'js!SBIS3.CORE.CompoundControl',
      'js!SBIS3.CORE.CompoundActiveFixMixin',
      'js!SBIS3.CONTROLS.DSMixin',
      'js!SBIS3.CONTROLS.MultiSelectable',
      'js!SBIS3.CONTROLS.Selectable',
      'js!SBIS3.CONTROLS.DataBindMixin',
      'js!SBIS3.CONTROLS.DecorableMixin',
      'js!SBIS3.CONTROLS.DragNDropMixin',
      'js!SBIS3.CONTROLS.ItemActionsGroup',
      'js!SBIS3.CORE.MarkupTransformer',
      'html!SBIS3.CONTROLS.ListView',
      'js!SBIS3.CONTROLS.Utils.TemplateUtil',
      'js!SBIS3.CONTROLS.CommonHandlers',
      'js!SBIS3.CONTROLS.MoveHandlers',
      'js!SBIS3.CONTROLS.Pager',
      'js!SBIS3.CONTROLS.EditInPlaceHoverController',
      'js!SBIS3.CONTROLS.EditInPlaceClickController',
      'js!SBIS3.CONTROLS.Link',
      'is!browser?html!SBIS3.CONTROLS.ListView/resources/ListViewGroupBy',
      'is!browser?html!SBIS3.CONTROLS.ListView/resources/emptyData',
      'is!browser?js!SBIS3.CONTROLS.ListView/resources/SwipeHandlers'
   ],
   function (CompoundControl, CompoundActiveFixMixin, DSMixin, MultiSelectable, Selectable, DataBindMixin, DecorableMixin, DragNDropMixin, ItemActionsGroup, MarkupTransformer, dotTplFn, TemplateUtil, CommonHandlers, MoveHandlers, Pager, EditInPlaceHoverController, EditInPlaceClickController, Link, groupByTpl, emptyDataTpl) {

      'use strict';

      var
         ITEMS_ACTIONS_HEIGHT = 20,
         DRAG_AVATAR_OFFSET = 5;

      /**
       * Контрол, отображающий внутри себя набор однотипных сущностей.
       * Умеет отображать данные списком по определенному шаблону, а так же фильтровать и сортировать.
       * @class SBIS3.CONTROLS.ListView
       * @extends $ws.proto.Control
       * @author Крайнов Дмитрий Олегович
       * @mixes SBIS3.CONTROLS.DSMixin
       * @mixes SBIS3.CONTROLS.MultiSelectable
       * @mixes SBIS3.CONTROLS.Selectable
       * @mixes SBIS3.CONTROLS.DecorableMixin
       * @mixes SBIS3.CONTROLS.DataBindMixin
       * @control
       * @public
       * @cssModifier controls-ListView__withoutMarker Убирать маркер активной строки.
       * @cssModifier controls-ListView__showCheckBoxes Чекбоксы показываются не по ховеру, а сразу все.
       * @cssModifier controls-ListView__hideCheckBoxes Скрыть все чекбоксы.
       * @cssModifier controls-ListView__pagerNoSizePicker Скрыть выбор размера страницы в пейджинге.
       * @cssModifier controls-ListView__pagerNoAmount Скрыть отображение количества записей на странице в пейджинге.
       * Т.е. текст "1-10" при отображении 10 записей на 1-ой странице
       */

      /*TODO CommonHandlers MoveHandlers тут в наследовании не нужны*/
      var ListView = CompoundControl.extend([CompoundActiveFixMixin, DSMixin, MultiSelectable, Selectable, DataBindMixin, DecorableMixin, DragNDropMixin, CommonHandlers, MoveHandlers], /** @lends SBIS3.CONTROLS.ListView.prototype */ {
         _dotTplFn: dotTplFn,
         /**
          * @event onChangeHoveredItem При переводе курсора мыши на другую запись
          * @remark
          * Событие срабатывает при смене записи под курсором мыши.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} hoveredItem Объект
          * @param {Number|String} hoveredItem.key ключ элемента представления данных
          * @param {jQuery|false} hoveredItem.container элемент представления данных
          * @param {Object} hoveredItem.position координаты контейнера элемента
          * @param {Number} hoveredItem.top отступ сверху
          * @param {Number} hoveredItem.left отступ слева
          * @param {Object} hoveredItem.size размеры контейнера элемента
          * @param {Number} hoveredItem.height высота
          * @param {Number} hoveredItem.width ширина
          * @example
          * <pre>
          *     DataGridView.subscribe('onChangeHoveredItem', function(hoveredItem) {
           *        var actions = DataGridView.getItemsActions(),
           *        instances = actions.getItemsInstances();
           *
           *        for (var i in instances) {
           *           if (instances.hasOwnProperty(i)) {
           *              //Будем скрывать кнопку удаления для всех строк
           *              instances[i][i === 'delete' ? 'show' : 'hide']();
           *           }
           *        }
           *     });
          * </pre>
          * @see itemsActions
          * @see setItemsActions
          * @see getItemsActions
          */
          /**
          * @event onItemClick При клике на запись
          * @remark
          * Событие срабатывает при любом клике под курсором мыши.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {String} id Ключ записи
          * @param {SBIS3.CONTROLS.Record} data запись
          * @param {jQuery} target html элемент на который кликнули
          */
          /**
          * @event onItemActivate При активации записи (клик с целью например редактирования или выбора)
          * @remark
          * Событие срабатывает при смене записи под курсором мыши.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} meta Объект
          * @param {String} meta.id ключ элемента представления данных
          * @param {SBIS3.CONTROLS.Record} meta.item запись
          */
         /**
          * @event onDataMerge Перед добавлением загруженных записей в основной dataSet
          * @remark
          * Событие срабатывает при подгрузке по скроллу, при подгрузке в ветку дерева.
          * Т.е. при любой вспеомогательной загрузке данных.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} dataSet - dataSet с загруженными данными
          * @example
          * <pre>
          *     DataGridView.subscribe('onDataMerge', function(event, dataSet) {
          *        //Если в загруженном датасете есть данные, отрисуем их количество
          *        var count = dataSet.getCount();
          *        if (count){
          *           self.drawItemsCounter(count);
          *        }
          *     });
          * </pre>
          */
         /**
          * @event onItemValueChanged Возникает при смене значения в одном из полей редактирования по месту и потере фокуса этим полем
          * @deprecated Будет удалено в 3.7.3.100. Временное решение
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Array} difference Массив измененных полей
          * @param {Object} model Модель с измененными данными
          */
         /**
          * @event onBeginEdit Возникает перед началом редактирования
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} model Редактируемая модель
          * @returns {*} Возможные значения:
          * <ol>
          *    <li>$ws.proto.Deferred - запуск редактирования по завершению работы возвращенного Deferred;</li>
          *    <li>false - прервать редактирование;</li>
          *    <li>* - продолжить редактирование в штатном режиме.</li>
          * </ol>
          */
         /**
          * @event onEndEdit Возникает перед окончанием редактирования (и перед валидацией области редактирования)
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} model Редактируемая модель
          * @returns {*} Возможные значения:
          * <ol>
          *    <li>false - отменить редактирование;</li>
          *    <li>* - продолжить редактирование в штатном режиме.</li>
          * </ol>
          */
         /**
          * @event onAfterEndEdit Возникает после окончания редактирования по месту
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} model Отредактированная модель
          */
         $protected: {
            _floatCheckBox: null,
            _dotItemTpl: null,
            _itemsContainer: null,
            _actsContainer: null,
            _hoveredItem: {
               target: null,
               container: null,
               key: null,
               position: null,
               size: null
            },
            _loadingIndicator: undefined,
            _editInPlace: null,
            _hasScrollMore: true,
            _infiniteScrollOffset: null,
            _allowInfiniteScroll: true,
            _scrollIndicatorHeight: 32,
            _isLoadBeforeScrollAppears : true,
            _infiniteScrollContainer: [],
            _pageChangeDeferred : undefined,
            _pager : undefined,
            _previousGroupBy : undefined,

            _keysWeHandle: [
               $ws._const.key.up,
               $ws._const.key.down,
               $ws._const.key.space,
               $ws._const.key.enter,
               $ws._const.key.right,
               $ws._const.key.left,
               $ws._const.key.o
            ],
            _itemActionsGroup: null,
            _editingItem: {
               target: null,
               model: null
            },
            _emptyData: undefined,
            _options: {
               /**
                * @cfg {Boolean} Разрешить отсутствие выбранного элемента
                * @example
                * <pre>
                *     <option name="allowEmptySelection">false</option>
                * </pre>
                */
               allowEmptySelection: false,
               /**
                * @faq Почему нет флажков при включенной опции {@link SBIS3.CONTROLS.ListView#multiselect multiselect}?
                * Для отрисовки флажков необходимо в шаблоне отображания элемента прописать их место:
                * <pre>
                *     <div class="listViewItem" style="height: 30px;">\
                *        <span class="controls-ListView__itemCheckBox"></span>\
                *        {{=it.item.get("title")}}\
                *     </div>
                * </pre>
                * @bind SBIS3.CONTROLS.ListView#itemTemplate
                * @bind SBIS3.CONTROLS.ListView#multiselect
                */
               /**
                * @cfg {String} Шаблон отображения каждого элемента коллекции
                * @remark
                * !Важно: опция обязательна к заполнению!
                * @example
                * <pre>
                *     <div class="listViewItem" style="height: 30px;">\
                *        {{=it.item.get("title")}}\
                *     </div>
                * </pre>
                * @see multiselect
                */
               itemTemplate: '',
               /**
                * @typedef {Array} ItemsActions
                * @property {String} name Имя кнопки.
                * @property {String} icon Путь до иконки.
                * @property {String} caption Текст на кнопке.
                * @property {String} tooltip Всплывающая подсказка.
                * @property {Boolean} isMainAction Отображать ли кнопку на строке или только выпадающем в меню.
                * На строке кнопки отображаются в том же порядке, в каком они перечислены.
                * На строке может быть только три кнопки, полный список будет в меню.
                * @property {Function} onActivated Действие кнопки.
                * @editor icon ImageEditor
                * @translatable caption
                */
               /**
                * @cfg {ItemsActions[]} Набор действий над элементами, отображающийся в виде иконок
                * @remark
                * Можно использовать для массовых операций.
                * @example
                * <pre>
                *     <options name="itemsActions" type="array">
                *        <options>
                *           <option name="name">btn1</option>
                *           <option name="icon">sprite:icon-16 icon-Delete icon-primary</option>
                *           <option name="isMainAction">false</option>
                *           <option name="tooltip">Удалить</option>
                *           <option name="onActivated" type="function">js!SBIS3.CONTROLS.Demo.MyListView:prototype.myOnActivatedHandler</option>
                *        </options>
                *        <options>
                *            <option name="name">btn2</option>
                *            <option name="icon">sprite:icon-16 icon-Trade icon-primary</option>
                *            <option name="tooltip">Изменить</option>
                *            <option name="isMainAction">true</option>
                *            <option name="onActivated" type="function">js!SBIS3.CONTROLS.Demo.MyListView:prototype.myOnActivatedHandler</option>
                *         </options>
                *     </options>
                * </pre>
                * @see setItemsActions
                */
               itemsActions: [{
                  name: 'delete',
                  icon: 'sprite:icon-16 icon-Erase icon-error',
                  tooltip: 'Удалить',
                  caption: 'Удалить',
                  isMainAction: true,
                  onActivated: function (item) {
                     this.deleteRecords(item.data('id'));
                  }
               },{
                  name: 'move',
                  icon: 'sprite:icon-16 icon-Move icon-primary action-hover',
                  tooltip: 'Перенести',
                  caption: 'Перенести',
                  isMainAction: false,
                  onActivated: function (item) {
                     this.selectedMoveTo(item.data('id'));
                  }
               }],
               /**
                * @cfg {Boolean} Разрешено или нет перемещение элементов "Drag-and-Drop"
                * @example
                * <pre>
                *     <option name="itemsDragNDrop">true</option>
                * </pre>
                */
               itemsDragNDrop: true,
               elemClickHandler: null,
               /**
                * @cfg {Boolean} Разрешить выбор нескольких строк
                * @remark
                * Позволяет выбрать несколько строк для одновременного взаимодействия с ними.
                * @example
                * <pre>
                *    <option name="multiselect">false</option>
                * </pre>
                * @see itemTemplate
                */
               multiselect: false,
               /**
                * @cfg {Boolean} Подгружать ли данные по скроллу
                * @example
                * <pre>
                *    <option name="infiniteScroll">true</option>
                * </pre>
                * @see isInfiniteScroll
                * @see setInfiniteScroll
                */
               infiniteScroll: false,
               /**
                * @cfg {Boolean} Игнорировать значение в localStorage (т.е. смотреть на опцию pageSize)
                * @remark Важно! На страницах нашего приложения есть функционал сохранения выбранного количества записей на всех реестрах.
                * Это значит, что если на одном реестре пользователь выбрал “отображать по 50 записей”, то по умолчанию в других реестрах тоже
                * будет отображаться 50 записей. Чтобы отключить функционал “следования выбору пользователя” на
                * конкретном табличном представлении есть опция ignoreLocalPageSize
                * (аналог css-класса ws-browser-ignore-local-page-size в старых табличных представления),
                * которую нужно поставить в true (по умолчанию она = false)
                * @example
                * <pre>
                *    <option name="ignoreLocalPageSize">true</option>
                * </pre>
                * @see pageSize
                */
               ignoreLocalPageSize: true,
               /**
                * @cfg {Boolean} Режим постраничной навигации
                * @remark
                * При частичной постраничной навигации заранее неизвестно общее количество страниц, режим пейджинга будет определн по параметру n из dataSource
                * Если пришел boolean, значит частичная постраничная навигация
                * @example
                * <pre>
                *     <option name="showPaging">true</option>
                * </pre>
                * @see setPage
                * @see getPage
                */
               showPaging: false,
               /**
                * @cfg {String} Режим редактирования по месту
                * @variant "" Редактирование по месту отлючено
                * @variant click Отображение редактирования по клику
                * @variant click|autoadd Отображение редактирования по клику и включение режима автоматического добавления
                * @variant hover Отображение редактирования по наведению мыши
                * @variant hover|autoadd Отображение редактирования по наведению мыши и включение режима автоматического добавления
                * @remark
                * Режим автоматического добавления позволяет при завершении редактирования последнего элемента автоматически создавать новый
                * @example
                * <pre>
                *     <opt name="editInPlaceMode">click</opt>
                * </pre>
                */
               editMode: '',
               /**
                * @cfg {String} Шаблон строки редактирования по месту.
                * Данная опция обладает большим приоритетом, чем заданный в колонках редактор.
                * @example
                * <pre>
                *     <opt name="editingTemplate">
                *       <component data-component="SBIS3.CONTROLS.TextBox" style="vertical-align: middle; display: inline-block; width: 100%;">
                *          <opt name="text" bind="TextValue"></opt>
                *          <opts name="validators" type="array">
                *             <opts>
                *                <opt name="validator" type="function">js!SBIS3.CORE.CoreValidators:required</opt>
                *             </opts>
                *          </opts>
                *       </component>
                *     </opt>
                * </pre>
                */
               editingTemplate: undefined,
               /**
                * @cfg {String} Позиция отображения строки итогов
                * Данная опция позволяет отображать строку итогов в случае отсутствия записей.
                * Возможные значения:
                * <ol>
                *    <li>'none' - Не отображать строку итогов</li>
                *    <li>'top' - вверху</li>
                *    <li>'bottom' - внизу</li>
                * </ol>
                */
               resultsPosition: 'none',
               /**
                * @cfg {String} Заголовок строки итогов
                */
               resultsText : 'Итого',
               resultsTpl: undefined
            }
         },

         $constructor: function () {
            //TODO временно смотрим на TopParent, чтобы понять, где скролл. С внедрением ScrallWatcher этот функционал уберем
            var topParent = this.getTopParent();
            this._publish('onChangeHoveredItem', 'onItemClick', 'onItemActivate', 'onDataMerge', 'onItemValueChanged', 'onBeginEdit', 'onEndEdit', 'onBeginAdd', 'onAfterEndEdit', 'onPrepareFilterOnMove');
            this._container.on('mousemove', this._mouseMoveHandler.bind(this))
                           .on('mouseleave', this._mouseLeaveHandler.bind(this));

            this._onWindowScrollHandler = this._onWindowScroll.bind(this);

            if (this.isInfiniteScroll()) {
               this._createLoadingIndicator();
               //В зависимости от настроек высоты подписываемся либо на скролл у окна, либо у контейнера
               if (!this._isHeightGrowable()) {
                  this.getContainer().bind('scroll.wsInfiniteScroll', this._onContainerScroll.bind(this));
               } else {
                  $(window).bind('scroll.wsInfiniteScroll', this._onWindowScrollHandler);
               }
               if ($ws.helpers.instanceOfModule(topParent, 'SBIS3.CORE.FloatArea')) {
                  //Если браузер лежит на всплывающей панели и имеет автовысоту, то скролл появляется у контейнера всплывашки (.parent())
                  topParent.subscribe('onScroll', this._onFAScroll.bind(this));
               }
            }
            if (this._options.itemsDragNDrop) {
               this._dragStartHandler = this._onDragStart.bind(this);
               this._getItemsContainer().bind('mousedown', this._dragStartHandler);
            }
            this.initEditInPlace();
            $ws.single.CommandDispatcher.declareCommand(this, 'activateItem', this._activateItem);
            $ws.single.CommandDispatcher.declareCommand(this, 'beginAdd', this._beginAdd);
            $ws.single.CommandDispatcher.declareCommand(this, 'beginEdit', this._beginEdit);
            $ws.single.CommandDispatcher.declareCommand(this, 'cancelEdit', this._cancelEdit);
            $ws.single.CommandDispatcher.declareCommand(this, 'commitEdit', this._commitEdit);
         },

         init: function () {
            var localPageSize = $ws.helpers.getLocalStorageValue('ws-page-size');
            this._options.pageSize = !this._options.ignoreLocalPageSize && localPageSize ? localPageSize : this._options.pageSize;
            if (typeof this._options.pageSize === 'string') {
               this._options.pageSize = this._options.pageSize * 1;
            }
            this.setGroupBy(this._options.groupBy, false);
            this._drawEmptyData();
            ListView.superclass.init.call(this);
            this.reload();
            this._touchSupport = $ws._const.browser.isMobilePlatform;
            if (this._touchSupport){
            	this._getItemActionsContainer().addClass('controls-ItemsActions__touch-actions');
            	this._container.bind('swipe', this._swipeHandler.bind(this))
                               .bind('tap', this._tapHandler.bind(this))
                               .bind('touchmove',this._mouseMoveHandler.bind(this));
            }
         },
         _scrollToItem: function(itemId) {
            $(".controls-ListView__item[data-id='" + itemId + "']", this._container).attr('tabindex', '-1').focus();
         },
         _keyboardHover: function (e) {
            var
               selectedKey = this.getSelectedKey(),
               newSelectedKey,
               newSelectedItem;
            switch (e.which) {
               case $ws._const.key.up:
                  newSelectedItem = this._getPrevItemByDOM(selectedKey);
                  break;
               case $ws._const.key.down:
                  newSelectedItem = this._getNextItemByDOM(selectedKey);
                  break;
               case $ws._const.key.enter:
                  var selectedItem = $('[data-id="' + selectedKey + '"]', this._getItemsContainer());
                  this._elemClickHandler(selectedKey, this._dataSet.getRecordByKey(selectedKey), selectedItem);
                  break;
               case $ws._const.key.space:
                  newSelectedItem = this._getNextItemByDOM(selectedKey);
                  this.toggleItemsSelection([selectedKey]);
                  break;
               case $ws._const.key.o:
                  if (e.ctrlKey && e.altKey && e.shiftKey) {
                     this.sendCommand('mergeItems', this.getSelectedKeys());
                  }
                  break;
            }
            if (newSelectedItem && newSelectedItem.length) {
               newSelectedKey = newSelectedItem.data('id');
               this.setSelectedKey(newSelectedKey);
               this._scrollToItem(newSelectedKey);
            }
            return false;
         },
         /**
          * Возвращает следующий элемент
          * @param id
          * @returns {*}
          */
         getNextItemById: function (id) {
            return this._getItem(id, true);
         },
         /**
          * Возвращает предыдущий элемент
          * @param id
          * @returns {jQuery}
          */
         getPrevItemById: function (id) {
            return this._getItem(id, false);
         },

         _getNextItemByDOM: function(id) {
            return this._getHtmlItemByDOM(id, true)
         },

         _getPrevItemByDOM: function(id) {
            return this._getHtmlItemByDOM(id, false)
         },

         _getItem: function(id, isNext) {
            if($ws.helpers.instanceOfMixin(this._dataSet, 'SBIS3.CONTROLS.Data.Collection.IList')) {
               var index = this._dataSet.getIndex(this._dataSet.getRecordByKey(id)),
                  item;
               item = this._dataSet.at(isNext ? ++index : --index);
               if (item)
                  return $('.js-controls-ListView__item[data-id="' + item.getId() + '"]', this._getItemsContainer());
               else
                  return undefined;
            } else {
               this._getHtmlItemByDOM(id, isNext);
            }
         },
         /**
          *
          * @param id - идентификатор элемента
          * @param isNext - если true вернет следующий элемент, пердыдущий
          * @returns {jQuery}
          * @private
          */
         // TODO Подумать, как решить данную проблему. Не надёжно хранить информацию в доме
         // Поиск следующего или предыдущего элемента коллекции с учётом вложенных контролов
         _getHtmlItemByDOM: function (id, isNext) {
            var items = $('.js-controls-ListView__item', this._getItemsContainer()).not('.ws-hidden'),
               selectedItem = $('[data-id="' + id + '"]', this._getItemsContainer()),
               index = items.index(selectedItem),
               siblingItem;
            if (isNext) {
               if (index + 1 < items.length) {
                  siblingItem = items.eq(index + 1);
               }
            }
            else {
               if (index > 0) {
                  siblingItem = items.eq(index - 1);
               }
            }
            if (siblingItem)
               return this._dataSet.getRecordByKey(siblingItem.data('id')) ? siblingItem : this._getHtmlItem(siblingItem.data('id'), isNext);
            else
               return undefined;
         },
         _isViewElement: function (elem) {
            return  $ws.helpers.contains(this._getItemsContainer()[0], elem[0]);
         },
         _onClickHandler: function(e) {
            ListView.superclass._onClickHandler.apply(this, arguments);
            var $target = $(e.target),
                target = this._findItemByElement($target),
                id;

            if (target.length && this._isViewElement(target)) {
               id = target.data('id');
               this._elemClickHandler(id, this._dataSet.getRecordByKey(id), e.target);
            }
            if (this._options.multiselect && $target.length && $target.hasClass('controls-DataGridView__th__checkBox')){
               $target.hasClass('controls-DataGridView__th__checkBox__checked') ? this.setSelectedKeys([]) :this.setSelectedItemsAll();
               $target.toggleClass('controls-DataGridView__th__checkBox__checked');
            }
         },
         /**
          * Обрабатывает перемещения мышки на элемент представления
          * @param e
          * @private
          */
         _mouseMoveHandler: function (e) {
            var $target = $(e.target),
                target, targetKey, hoveredItemClone;

            target = this._findItemByElement($target);

            if (target.length) {
               targetKey = target[0].getAttribute('data-id');
               if (targetKey !== undefined && this._hoveredItem.key !== targetKey) {
                  this._hoveredItem.container && this._hoveredItem.container.removeClass('controls-ListView__hoveredItem');
                  target.addClass('controls-ListView__hoveredItem');
                  this._hoveredItem = this._getElementData(target);

                  /* Надо делать клон и отдавать наружу только клон объекта, иначе,
                     если его кто-то испортит, испортится он у всех, в том числе и у нас */
                  hoveredItemClone = $ws.core.clone(this._hoveredItem);
                  this._notify('onChangeHoveredItem', hoveredItemClone);
                  this._onChangeHoveredItem(hoveredItemClone);
               }
            } else if (!this._isHoverControl($target)) {
               this._mouseLeaveHandler();
            }
         },

         _getElementData: function(target) {
            if (target.length){
               var cont = this._container[0],
                   containerCords = cont.getBoundingClientRect(),
                   targetKey = target[0].getAttribute('data-id'),
               //FIXME т.к. строка редактирования по местру спозиционирована абсолютно, то надо искать оригинальную строку
                   correctTarget = target.hasClass('controls-editInPlace') ?
                       this._getItemsContainer().find('[data-id="' + targetKey + '"]:not(.controls-editInPlace)') :
                       target,
                   targetCords = correctTarget[0].getBoundingClientRect();

               return {
                  key: targetKey,
                  record: this.getDataSet().getRecordByKey(targetKey),
                  container: correctTarget,
                  position: {
                     /* При расчётах координат по вертикали учитываем прокрутку */
                     top: targetCords.top - containerCords.top + cont.scrollTop,
                     left: targetCords.left - containerCords.left
                  },
                  size: {
                     height: correctTarget[0].offsetHeight,
                     width: correctTarget[0].offsetWidth
                  }
               }
            }
         },

         /**
          * Проверяет, относится ли переданный элемент,
          * к контролам которые отображаются по ховеру.
          * @param {jQuery} $target
          * @returns {boolean}
          * @private
          */
         _isHoverControl: function ($target) {
            var itemActionsContainer = this._itemActionsGroup && this._itemActionsGroup.getContainer();
            return itemActionsContainer && (itemActionsContainer[0] === $target[0] || $.contains(itemActionsContainer[0], $target[0]) || this._itemActionsGroup.isItemActionsMenuVisible());
         },
         /**
          * Обрабатывает уведение мышки с элемента представления
          * @private
          */
         _mouseLeaveHandler: function () {
            if (this._hoveredItem.container === null) {
               return;
            }
            this._hoveredItem.container && this._hoveredItem.container.removeClass('controls-ListView__hoveredItem');

            /* Затрём всю информацию о выделенном элементе */
            var emptyObject = {};
            for(var key in this._hoveredItem) {
               if(this._hoveredItem.hasOwnProperty(key)) {
                  emptyObject[key] = null;
               }
            }
            this._hoveredItem = emptyObject;

            this._notify('onChangeHoveredItem', this._hoveredItem);
            this._onChangeHoveredItem(this._hoveredItem);
         },
         /**
          * Обработчик на смену выделенного элемента представления
          * @private
          */
         _onChangeHoveredItem: function (target) {
            if (this._options.itemsActions.length) {
         		if (target.container && !this._touchSupport){
                  this._showItemActions(target);
               } else {
                  this._hideItemActions();
               }
            }
         },

         /**
          * Установить что отображается при отсутствии записей.
          * @param html Содержимое блока.
          * @example
          * <pre>
          *     DataGridView.setEmptyHTML('Нет записей');
          * </pre>
          * @see emptyHTML
          */
         setEmptyHTML: function (html) {
            ListView.superclass.setEmptyHTML.apply(this, arguments);
            if(this._emptyData.length) {
               html ? this._emptyData.empty().html(html) : this._emptyData.remove();
            } else if(html) {
               this._drawEmptyData();
            }
         },
         _drawEmptyData: function() {
            var html = this._options.emptyHTML;
            this._emptyData = html && $(emptyDataTpl({emptyHTML: html})).appendTo(this._container);
         },
         _getItemTemplate: function () {
            return this._options.itemTemplate;
         },
         /**
          * Устанавливает шаблон отображения элемента
          * @param  {String} tpl Шаблон отображения каждого элемента коллекции
          * @example
          * <pre>
          *     DataGridView.setEmptyHTML('html!MyTemplate');
          * </pre>
          * @see emptyHTML
          */
         setItemTemplate: function(tpl) {
            this._options.itemTemplate = tpl;
         },

         _getItemsContainer: function () {
            return $('.controls-ListView__itemsContainer', this._container.get(0)).first();
         },

         _addItemAttributes: function(container) {
            container.addClass('js-controls-ListView__item');
            ListView.superclass._addItemAttributes.apply(this, arguments);
         },

         /* +++++++++++++++++++++++++++ */

         _elemClickHandler: function (id, data, target) {
            var $target = $(target);

            this.setSelectedKey(id);
            if (this._options.multiselect) {
               //TODO: оставить только js класс
               if ($target.hasClass('js-controls-ListView__itemCheckBox') || $target.hasClass('controls-ListView__itemCheckBox')) {
                  this.toggleItemsSelection([$target.closest('.controls-ListView__item').attr('data-id')]);
               }
               else {
                  this._notifyOnItemClick(id, data, target);
               }
            }
            else {
               this.setSelectedKeys([id]);
               this._notifyOnItemClick(id, data, target);
            }
         },
         _notifyOnItemClick: function(id, data, target) {
            var
                elClickHandler = this._options.elemClickHandler,
                res = this._notify('onItemClick', id, data, target);
            if (res !== false) {
               this._elemClickHandlerInternal(data, id, target);
               elClickHandler && elClickHandler.call(this, id, data, target);
            }
         },
         _elemClickHandlerInternal: function (data, id, target) {
            this._activateItem(id);
         },
         _drawSelectedItems: function (idArray) {
            $(".controls-ListView__item", this._container).removeClass('controls-ListView__item__multiSelected');
            for (var i = 0; i < idArray.length; i++) {
               $(".controls-ListView__item[data-id='" + idArray[i] + "']", this._container).addClass('controls-ListView__item__multiSelected');
            }
         },

         _drawSelectedItem: function (id) {
            $(".controls-ListView__item", this._container).removeClass('controls-ListView__item__selected');
            $(".controls-ListView__item[data-id='" + id + "']", this._container).addClass('controls-ListView__item__selected');
         },
         /**
          * Перезагружает набор записей представления данных с последующим обновлением отображения.
          * @example
          * <pre>
          *    var btn = new Button({
           *         element: "buttonReload",
           *         caption: 'reload offset: 450'
           *    }).subscribe('onActivated', function(event, id){
           *           //При нажатии на кнопку перезагрузим DataGridView  с 450ой записи
           *           DataGridViewBL.reload(DataGridViewBL._filter, DataGridViewBL.getSorting(), 450, DataGridViewBL._limit);
           *    });
          * </pre>
          */
         reload: function () {
            this._reloadInfiniteScrollParams();
            this._previousGroupBy = undefined;
            this._hideItemActions();
            this._destroyEditInPlace();
            return ListView.superclass.reload.apply(this, arguments);
         },
         _reloadInfiniteScrollParams : function(){
            if (this.isInfiniteScroll() || this._isAllowInfiniteScroll()) {
               //this._loadingIndicator = undefined;
               this._hasScrollMore = true;
               this._infiniteScrollOffset = this._offset;
               //После релоада придется заново догружать данные до появлени скролла
               this._isLoadBeforeScrollAppears = true;
            }
         },
         /**
          * Метод установки/замены обработчика клика по строке.
          * @param method Имя новой функции обработчика клика по строке.
          * @example
          * <pre>
          *     var myElemClickHandler = function(id, data, target){
           *        console.log(id, data, target)
           *     }
          *     DataGridView.setElemClickHandler(myElemClickHandler);
          * </pre>
          * @see elemClickHandler
          */
         setElemClickHandler: function (method) {
            this._options.elemClickHandler = method;
         },

         setEnabled: function(enabled) {
            if (!enabled) {
               this._cancelEdit();
            }
            ListView.superclass.setEnabled.apply(this, arguments);
         },
         //********************************//
         //   БЛОК РЕДАКТИРОВАНИЯ ПО МЕСТУ //
         //*******************************//
         initEditInPlace: function() {
            this._notifyOnItemClick = this.beforeNotifyOnItemClick();
            if (this._options.editMode.indexOf('click') !== -1) {
               this.subscribe('onItemClick', this._onItemClickHandler);
            } else if (this._options.editMode.indexOf('hover') !== -1) {
               this.subscribe('onChangeHoveredItem', this._onChangeHoveredItemHandler);
            }
         },
         beforeNotifyOnItemClick: function() {
            var handler = this._notifyOnItemClick;
            return function() {
               var args = arguments;
               if (this._editInPlace) {
                  this._editInPlace.endEdit(true).addCallback(function() {
                     handler.apply(this, args)
                  }.bind(this));
               } else {
                  handler.apply(this, args)
               }
            }
         },
         setEditMode: function(editMode) {
            if (editMode !== this._options.editMode && (editMode === '' || editMode === 'click' || editMode === 'hover')) {
               if (this._options.editMode === 'click') {
                  this.unsubscribe('onItemClick', this._onItemClickHandler);
               } else if (this._options.editMode === 'hover') {
                  this.unsubscribe('onChangeHoveredItem', this._onChangeHoveredItemHandler);
               }
               this._destroyEditInPlace();
               this._options.editMode = editMode;
               if (this._options.editMode === 'click') {
                  this.subscribe('onItemClick', this._onItemClickHandler);
               } else if (this._options.editMode === 'hover') {
                  this.subscribe('onChangeHoveredItem', this._onChangeHoveredItemHandler);
               }
            }
         },

         getEditMode: function() {
            return this._options.editMode;
         },

         showEip: function(target, record, isEdit) {
            if (this.isEnabled()) {
               this._getEditInPlace().showEip(target, record, isEdit);
            }
         },

         _onItemClickHandler: function(event, id, record, target) {
            this.showEip($(target).closest('.js-controls-ListView__item'), record);
            event.setResult(false);
         },

         _onChangeHoveredItemHandler: function(event, hoveredItem) {
            var target = hoveredItem.container;
            if (target && !(target.hasClass('controls-editInPlace') || target.hasClass('controls-editInPlace__editing'))) {
               this.showEip(target, this._dataSet.getRecordByKey(hoveredItem.key), false);
            } else {
               this._getEditInPlace().hide();
            }
         },

         redrawItem: function(item) {
            ListView.superclass.redrawItem.apply(this, arguments);
            if (this._editingItem.model && this._editingItem.model.getKey() === item.getKey()) {
               this._editingItem.target = this._getElementByModel(item);
            }
         },

         /**
          * @private
          */
         _getEditInPlace: function() {
            if (!this._editInPlace) {
               this._createEditInPlace();
            }
            return this._editInPlace;
         },

         _createEditInPlace: function() {
            var
               hoverMode = !$ws._const.isMobilePlatform && (this._options.editMode === 'hover|autoadd' || this._options.editMode === 'hover'),
               controller = hoverMode ? EditInPlaceHoverController : EditInPlaceClickController;
            this._editInPlace = new controller(this._getEditInPlaceConfig(hoverMode));
         },

         _destroyEditInPlace: function() {
            if (this._editInPlace) {
               this._editInPlace.destroy();
               this._editInPlace = null;
            }
         },

         _getEditInPlaceConfig: function(hoverMode) {
            //todo Герасимов, Сухоручкин: для hover-режима надо передать в опции метод
            //options.editFieldFocusHandler = this._editFieldFocusHandler.bind(this) - подумать, как это сделать
            var
               config = {
                  dataSet: this._dataSet,
                  editingItem: this._editingItem,
                  ignoreFirstColumn: this._options.multiselect,
                  columns: this._options.columns,
                  dataSource: this._dataSource,
                  editingTemplate: this._options.editingTemplate,
                  itemsContainer: this._getItemsContainer(),
                  element: $('<div>'),
                  opener: this,
                  modeAutoAdd: this._options.editMode === 'click|autoadd' || this._options.editMode === 'hover|autoadd',
                  handlers: {
                     onItemValueChanged: function(event, difference, model) {
                        event.setResult(this._notify('onItemValueChanged', difference, model));
                     }.bind(this),
                     onBeginEdit: function(event, model) {
                        event.setResult(this._notify('onBeginEdit', model));
                     }.bind(this),
                     onBeginAdd: function(event, options) {
                        event.setResult(this._notify('onBeginAdd', options));
                     }.bind(this),
                     onEndEdit: function(event, model, withSaving) {
                        event.setResult(this._notify('onEndEdit', model, withSaving));
                     }.bind(this),
                     onAfterEndEdit: function(event, model, target, withSaving) {
                        if (withSaving) {
                           this.redrawItem(model);
                        }
                        event.setResult(this._notify('onAfterEndEdit', model, target, withSaving));
                     }.bind(this)
                  }
               };
            return config;
         },

         _getElementByModel: function(item) {
            // Даже не думать удалять ":not(...)". Это связано с тем, что при редактировании по месту может возникнуть задача перерисовать строку
            // DataGridView. В виду одинакового атрибута "data-id", это единственный способ отличить строку DataGridView от строки EditInPlace.
            return this._getItemsContainer().find('.js-controls-ListView__item[data-id="' + item.getKey() + '"]:not(".controls-editInPlace")');
         },

         //********************************//
         //   БЛОК ОПЕРАЦИЙ НАД ЗАПИСЬЮ    //
         //*******************************//

         _swipeHandler: function(e){
            var target = this._findItemByElement($(e.target)),
               item = this._getElementData(target);
            if (this._options.itemsActions.length) {
               if (e.direction == 'left'){
            		item.container ? this._showItemActions(item) : this._hideItemActions();
                  this._hoveredItem = item;
               } else {
                  this._hideItemActions(true);
               }
            }
         },

         _tapHandler: function(e){
            var target = this._findItemByElement($(e.target));
            this.setSelectedKey(target.data('id'));
         },

         _findItemByElement: function(target){
            if(!target.length) {
               return [];
            }

            var elem = target.closest('.js-controls-ListView__item', this._getItemsContainer());

            // TODO Подумать, как решить данную проблему. Не надёжно хранить информацию в доме
            // TODO  В качестве возможного решения: сохранять ссылку на дом элемент
            /* Поиск элемента коллекции с учётом вложенных контролов,
               обязательно проверяем, что мы нашли, возможно это элемент вложенного контрола,
               тогда поднимемся на уровень выше и опять поищем */
            return elem[0] && this.getDataSet().getRecordByKey(elem[0].getAttribute('data-id')) ? elem : this._findItemByElement(elem.parent());
         },
         /**
          * Показывает оперцаии над записью для элемента
          * @private
          */
         _showItemActions: function (item) {
            //Если происходит перемещение записей, не нужно показывать операции над записями
            if (this._isShifted) {
               return;
            }
            //Создадим операции над записью, если их нет
            this.getItemsActions();
            this._itemActionsGroup.applyItemActions();

            //Если показывается меню, то не надо позиционировать операции над записью
            if (this._itemActionsGroup.isItemActionsMenuVisible()) {
               return;
            }
            this._itemActionsGroup.showItemActions(item, this._getItemActionsPosition(item));
            if (this._touchSupport){
               this._trackMove = $ws.helpers.trackElement(item.container, true);
               this._trackMove.subscribe('onMove', this._moveItemActions, this);
            }
         },
         _hideItemActions: function (animate) {
            if (this._itemActionsGroup && !this._itemActionsGroup.isItemActionsMenuVisible()) {
               this._itemActionsGroup.hideItemActions(animate);
            }
            if (this._trackMove) {
               this._trackMove.unsubscribe('onMove', this._moveItemActions);
               this._trackMove = null;
            }
         },
         _moveItemActions: function(event, offset){
            this._getItemActionsContainer()[0].style.top = offset.top - this._container.offset().top + 'px';
         },
         _getItemActionsPosition: function (item) {
            return {
               top : item.position.top + ((item.size.height > ITEMS_ACTIONS_HEIGHT) ? item.size.height - ITEMS_ACTIONS_HEIGHT : 0 ),
               right : this._touchSupport ? item.position.top : this._container[0].offsetWidth - (item.position.left + item.size.width)
            };
         },
         /**
          * Создаёт операции над записью
          * @private
          */
         _drawItemActions: function () {
            var actionsContainer = this._container.find('> .controls-ListView__itemActions-container');
            return new ItemActionsGroup({
               items: this._options.itemsActions,
               element: this._getItemActionsContainer(),
               keyField: 'name',
               parent: this
            });
         },
         /**
          * Возвращает контейнер для операций над записью
          * @returns {*}
          * @private
          */
         _getItemActionsContainer: function() {
            var actionsContainer = this._container.find('> .controls-ListView__itemActions-container');

            return actionsContainer.length ? actionsContainer : $('<div class="controls-ListView__itemActions-container"/>').appendTo(this._container);
         },
         /**
          * Инициализирует операции над записью
          * @private
          */
         _initItemsActions: function () {
            this._itemActionsGroup = this._drawItemActions();
         },
         /**
          * Метод получения операций над записью.
          * @returns {Array} Массив операций над записью.
          * @example
          * <pre>
          *     DataGridView.subscribe('onChangeHoveredItem', function(hoveredItem) {
          *        var actions = DataGridView.getItemsActions(),
          *        instances = actions.getItemsInstances();
          *
          *        for (var i in instances) {
          *           if (instances.hasOwnProperty(i)) {
          *              //Будем скрывать кнопку удаления для всех строк
          *              instances[i][i === 'delete' ? 'show' : 'hide']();
          *           }
          *        }
          *     });
          * </pre>
          * @see itemsActions
          * @see setItemActions
          */
         getItemsActions: function () {
            if (!this._itemActionsGroup && this._options.itemsActions.length) {
               this._initItemsActions();
            }
            return this._itemActionsGroup;
         },
         /**
          * Метод установки или замены кнопок операций над записью, заданных в опции {@link itemsActions}
          * @remark
          * В метод нужно передать массив обьектов.
          * @param {Array} items Объект формата {name: ..., icon: ..., caption: ..., onActivated: ..., isMainOption: ...}
          * @param {String} items.name Имя кнопки операции над записью.
          * @param {String} items.icon Иконка кнопки.
          * @param {String} items.caption Текст на кнопке.
          * @param {String} items.onActivated Обработчик клика по кнопке.
          * @param {String} items.tooltip Всплывающая подсказка.
          * @param {String} items.title Текст кнопки в выпадающем меню.
          * @param {String} items.isMainOption На строке ли кнопка (или в меню).
          * @example
          * <pre>
          *     DataGridView.setItemsActions([{
          *        name: 'delete',
          *        icon: 'sprite:icon-16 icon-Erase icon-error',
          *        caption: 'Удалить',
          *        isMainAction: true,
          *        onActivated: function(item) {
          *           this.deleteRecords(item.data('id'));
          *        }
          *     },
          *     {
          *        name: 'addRecord',
          *        icon: 'sprite:icon-16 icon-Add icon-error',
          *        caption: 'Добавить',
          *        isMainAction: true,
          *        onActivated: function(item) {
          *           this.showRecordDialog();
          *        }
          *     }]
          * <pre>
          * @see itemsActions
          * @see getItemsActions
          * @see getHoveredItem
          */
         setItemsActions: function (items) {
            this._options.itemsActions = items;
            this._itemActionsGroup ? this._itemActionsGroup.setItems(items) : this._initItemsActions();
         },
         //**********************************//
         //КОНЕЦ БЛОКА ОПЕРАЦИЙ НАД ЗАПИСЬЮ //
         //*********************************//

         _drawItemsCallback: function () {
            var hoveredItem = this._hoveredItem.container;

            if (this.isInfiniteScroll()) {
               this._loadBeforeScrollAppears();
            }
            this._drawSelectedItems(this._options.selectedKeys);
            this._drawSelectedItem(this._options.selectedKey);

            /* Если после перерисовки выделенный элемент удалился из DOM дерава,
               то событие mouseLeave не сработает, поэтому вызовем руками метод */
            if(hoveredItem && !$.contains(this._getItemsContainer()[0], hoveredItem[0])) {
               this._mouseLeaveHandler();
            }

            this._notifyOnSizeChanged(true);
            this._drawResults();
         },
         //-----------------------------------infiniteScroll------------------------
         //TODO Сделать подгрузку вверх
         //TODO (?) избавиться от _allowInfiniteScroll - пусть все будет завязано на опцию infiniteScroll
         /**
          * Используется ли подгрузка по скроллу.
          * @returns {Boolean} Возможные значения:
          * <ol>
          *    <li>true - используется подгрузка по скроллу;</li>
          *    <li>false - не используется.</li>
          * </ol>
          * @example
          * Переключим режим управления скроллом:
          * <pre>
          *     listView.setInfiniteScroll(!listView.isInfiniteScroll());
          * </pre>
          * @see infiniteScroll
          * @see setInfiniteScroll
          */
         isInfiniteScroll: function () {
            return this._options.infiniteScroll && this._allowInfiniteScroll;
         },
         /**
          *  Общая проверка и загрузка данных для всех событий по скроллу
          */
         _loadChecked: function (result) {
            //Важно, чтобы датасет уже был готов к моменту, когда мы попытаемся грузить данные
            if (this._dataSet && result) {
               this._nextLoad();
            }
         },
         _onWindowScroll: function (event) {
            this._loadChecked(this._isBottomOfPage());
         },
         _onFAScroll: function(event, scrollOptions) {
            this._loadChecked(scrollOptions.clientHeight + scrollOptions.scrollTop >= scrollOptions.scrollHeight - $ws._const.Browser.minHeight);
         },
         _onContainerScroll: function () {
            this._loadChecked(this._loadingIndicator.offset().top - this.getContainer().offset().top < this.getContainer().height());
         },
         /**
          * Проверка на автовысоту у ListView. Аналог из TableView
          * @returns {*}
          * @private
          */
         _isHeightGrowable: function() {
            //В новых компонентах никто пока не смотрит на verticalAlignment
            return this._options.autoHeight;/*&& this._verticalAlignment !== 'Stretch';*/
         },
         _nextLoad: function () {
            var self = this,
               loadAllowed  = this._isAllowInfiniteScroll(),
               records;
            //Если в догруженных данных в датасете пришел n = false, то больше не грузим.
            if (loadAllowed && $ws.helpers.isElementVisible(this.getContainer()) &&
                  this._hasNextPage(this._dataSet.getMetaData().more, this._infiniteScrollOffset) && this._hasScrollMore && !this._isLoading()) {
               this._showLoadingIndicator();
               this._loader = this._callQuery(this.getFilter(), this.getSorting(), this._infiniteScrollOffset + this._limit, this._limit).addCallback($ws.helpers.forAliveOnly(function (dataSet) {
                  //ВНИМАНИЕ! Здесь стрелять onDataLoad нельзя! Либо нужно определить событие, которое будет
                  //стрелять только в reload, ибо между полной перезагрузкой и догрузкой данных есть разница!
                  self._loader = null;
                  /*Леша Мальцев добавил скрытие индикатора, но на контейнерах с фиксированной высотой это чревато неправильным определением  offset от индикатора
                  * Т.е. можем не определить, что доскроллили до низа страницы. индикатор должен юыть виден, пока не загрузим все данные
                  */
                  if (self._isHeightGrowable()) {
                     self._hideLoadingIndicator();
                  }
                  //нам до отрисовки для пейджинга уже нужно знать, остались еще записи или нет
                  if (self._hasNextPage(dataSet.getMetaData().more, self._infiniteScrollOffset)) {
                     self._infiniteScrollOffset += self._limit;
                  } else {
                     self._hasScrollMore = false;
                     self._hideLoadingIndicator();
                  }
                  self._notify('onDataMerge', dataSet);
                  //Если данные пришли, нарисуем
                  if (dataSet.getCount()) {
                     records = dataSet._getRecords();
                     self._dataSet.merge(dataSet, {remove: false});
                     self._drawItems(records);
                     self._dataLoadedCallback();
                     self._toggleEmptyData();
                  }

               }, self)).addErrback(function (error) {
                  //Здесь при .cancel приходит ошибка вида DeferredCanceledError
                  return error;
               });
            }
         },
         _isAllowInfiniteScroll : function(){
            return this._allowInfiniteScroll;
         },
         _isBottomOfPage: function () {
            var docBody = document.body,
               docElem = document.documentElement,
               clientHeight = Math.min(docBody.clientHeight, docElem.clientHeight),
               scrollTop = Math.max(docBody.scrollTop, docElem.scrollTop),
               scrollHeight = Math.max(docBody.scrollHeight, docElem.scrollHeight);
            return (clientHeight + scrollTop >= scrollHeight - this._scrollIndicatorHeight);//Учитываем отступ снизу на высоту картинки индикатора загрузки
         },
         _loadBeforeScrollAppears: function(){
            /*
            *   TODO убрать зависимость от опции autoHeight, перенести в scrollWatcher возможность отслежитвания скролла по переданному классу
            *   и все, что связано c GrowableHeight
            *   Так же убрать overflow:auto - прикладные разработчики сами будут его навешивать на нужный им див
            */
            /**
             * Если у нас автовысота, то подгружать данные надо пока размер контейнера не привысит размеры экрана (контейнера window)
             * Если же высота фиксированная, то подгружать данные в этой функции будем пока высота контейнера(ту, что фиксированно задали) не станет меньше высоты таблицы(table),
             * т.е. пока не появится скролл внутри контейнера
             */
            var  windowHeight = $(window).height(),
                checkHeights = this._isHeightGrowable() ?
                  this._container.height() < windowHeight :
                  this._container.height() >= this._container.find('.js-controls-View__scrollable').height();
            //Если на странице появился скролл и мы достигли дна скролла
            if (this._isLoadBeforeScrollAppears && checkHeights){
               this._nextLoad();
            } else {
               this._isLoadBeforeScrollAppears = false;
            }
         },
         /**
          * Если высота контейнера меньше высоты экрана (т.е. нет скролла в контейнере иди в окне),
          * то будет загружать данные, пока скролл все-таки не появится.
          * Работает в паре с взведенной опцией infiniteScroll
          * @remark Работает только в 3.7.3.30
          * @see infiniteScroll
          */
         loadDataTillScroll : function(){
            this._isLoadBeforeScrollAppears = true;
            this._loadBeforeScrollAppears();
         },
         _showLoadingIndicator: function () {
            if (!this._loadingIndicator) {
               this._createLoadingIndicator();
            }
            this._loadingIndicator.removeClass('ws-hidden');
         },
         /**
          * Удаляет индикатор загрузки
          * @private
          */
         _hideLoadingIndicator: function () {
            if (this._loadingIndicator && !this._loader) {
               this._loadingIndicator.addClass('ws-hidden');
            }
         },
         _createLoadingIndicator : function () {
            this._loadingIndicator = this._container.find('.controls-ListView-scrollIndicator');
            this._scrollIndicatorHeight = this._loadingIndicator.height();
         },
         /**
          * Метод изменения возможности подгрузки по скроллу.
          * @remark
          * Метод изменяет значение, заданное в опции {@link infiniteScroll}.
          * @param {Boolean} allow Разрешить (true) или запретить (false) подгрузку по скроллу.
          * @param {Boolean} [noLoad] Сразу ли загружать (true - не загружать сразу).
          * @example
          * Переключим режим управления скроллом:
          * <pre>
          *     listView.setInfiniteScroll(!listView.isInfiniteScroll())
          * </pre>
          * @see infiniteScroll
          * @see isInfiniteScroll
          */
         setInfiniteScroll: function (allow, noLoad) {
            this._allowInfiniteScroll = allow;
            if (allow && !noLoad) {
               this._nextLoad();
               return;
            }
            //НА саом деле если во время infiniteScroll произошла ошибка загрузки, я о ней не смогу узнать, но при выключении нужно убрать индикатор
            if (!allow && this._loadingIndicator && this._loadingIndicator.is(':visible')){
               this._cancelLoading();
            }
            //Убираем текст Еще 10, если включили бесконечную подгрузку
            this.getContainer().find('.controls-TreePager-container').toggleClass('ws-hidden', allow);
            this._hideLoadingIndicator();
         },
         /**
          * Геттер для получения текущего выделенного элемента
          * @returns {{key: null | number, container: (null | jQuery)}}
          * @example
          * <pre>
          *     editButton.bind('click', functions: (e) {
          *        var hoveredItem = this.getHoveredItem();
          *        if(hoveredItem.container) {
          *           myBigToolTip.showAt(hoveredItem.position);
          *        }
          *     })
          * </pre>
          * @see itemsActions
          * @see getItemActions
          */
         getHoveredItem: function () {
            return this._hoveredItem;
         },
         _dataLoadedCallback: function () {
            if (this._options.showPaging) {
               this._processPaging();
               this._updateOffset();
            }
            if (this.isInfiniteScroll()) {
               if (!this._hasNextPage(this._dataSet.getMetaData().more)) {
                  this._hideLoadingIndicator();
               }
            }
            ListView.superclass._dataLoadedCallback.apply(this, arguments);
         },
         _toggleIndicator: function(show){
            this._showedLoading = show;
            var self = this;
            if (show) {
               setTimeout(function(){
                  if (self._showedLoading) {
                     self._container.find('.controls-AjaxLoader').toggleClass('ws-hidden', false);
                  }
               }, 750);
            }
            else {
               self._container.find('.controls-AjaxLoader').toggleClass('ws-hidden', true);
            }
         },
         _toggleEmptyData: function(show) {
            if(this._emptyData) {
               this._emptyData.toggleClass('ws-hidden', !show);
            }
         },
         //------------------------Paging---------------------
         _processPaging: function() {
            this._processPagingStandart();
         },
         _processPagingStandart: function () {
            if (!this._pager) {
               var more = this._dataSet.getMetaData().more,
                  hasNextPage = this._hasNextPage(more),
                  pagingOptions = {
                     recordsPerPage: this._options.pageSize || more,
                     currentPage: 1,
                     recordsCount: more,
                     pagesLeftRight: 3,
                     onlyLeftSide: typeof more === 'boolean', // (this._options.display.usePaging === 'parts')
                     rightArrow: hasNextPage
                  },
                  pagerContainer = this.getContainer().find('.controls-Pager-container').append('<div/>'),
                  self = this;

               this._pager = new Pager({
                  pageSize: this._options.pageSize,
                  opener: this,
                  ignoreLocalPageSize: this._options.ignoreLocalPageSize,
                  element: pagerContainer.find('div'),
                  allowChangeEnable: false, //Запрещаем менять состояние, т.к. он нужен активный всегда
                  pagingOptions: pagingOptions,
                  handlers: {
                     'onPageChange': function (event, pageNum, deferred) {
                        self._setPageSave(pageNum);
                        self.setPage(pageNum - 1);
                        self._pageChangeDeferred = deferred;
                     }
                  }
               });
            }
            this._updatePaging();
         },
         /**
          * Метод обработки интеграции с пейджингом
          */
         _updatePaging: function () {
            var more = this._dataSet.getMetaData().more,
               nextPage = this.isInfiniteScroll() ? this._hasScrollMore : this._hasNextPage(more),
               numSelected = 0;
            if (this._pager) {
               //Если данных в папке нет, не рисуем Pager
               this._pager.getContainer().toggleClass('ws-hidden', !this._dataSet.getCount());
               var pageNum = this._pager.getPaging().getPage();
               if (this._pageChangeDeferred) { // только когда меняли страницу
                  this._pageChangeDeferred.callback([this.getPage() + 1, nextPage, nextPage]);//смотреть в DataSet мб ?
                  this._pageChangeDeferred = undefined;
               }
               //Если на странице больше нет записей - то устанавливаем предыдущую (если это возможно)
               if (this._dataSet.getCount() === 0 && pageNum > 1) {
                  this._pager.getPaging().setPage(1); //чтобы не перезагружать поставим 1ую. было : pageNum - 1
               }
               this._pager.getPaging().update(this.getPage(this.isInfiniteScroll() ? this._infiniteScrollOffset + this._options.pageSize : this._offset) + 1, more, nextPage);
               if (this._options.multiselect) {
                  numSelected = this.getSelectedKeys().length;
               }
               this._pager.updateAmount(this._dataSet.getCount(), nextPage, numSelected);
            }
         },
         /**
          * Установить страницу по её номеру.
          * @remark
          * Метод установки номера страницы, с которой нужно открыть представление данных.
          * Работает при использовании постраничной навигации.
          * @param pageNumber Номер страницы.
          * @example
          * <pre>
          *    if(DataGridView.getPage() > 0)
          *       DataGridView.setPage(0);
          * </pre>
          * @see getPage
          * @see paging
          */
         setPage: function (pageNumber, noLoad) {
            pageNumber = parseInt(pageNumber, 10);
            var offset = this._offset;
            if (this._options.showPaging) {
               this._offset = this._options.pageSize * pageNumber;
               if (!noLoad && this._offset !== offset) {
                  this.reload();
               }
            }
         },

         /**
          * Получить номер текущей страницы.
          * @remark
          * Метод получения номера текущей страницы представления данных.
          * Работает при использовании постраничной навигации.
          * @example
          * <pre>
          *    if(DataGridView.getPage() > 0)
          *       DataGridView.setPage(0);
          * </pre>
          * @see paging
          * @see setPage
          * @param {Number} [offset] - если передать, то номер страницы рассчитается от него
          */
         getPage: function (offset) {
            var offset = offset || this._offset,
                more = this._dataSet.getMetaData().more;
            //Если offset отрицательный, значит запросили последнюю страницу.
            return Math.ceil((offset < 0 ? more + offset : offset) / this._options.pageSize);
         },
         _updateOffset: function () {
            var more = this._dataSet.getMetaData().more,
               nextPage = this._hasNextPage(more);
            if (this.getPage() === -1) {
               this._offset = more - this._options.pageSize;
            }
         },
         //------------------------GroupBy---------------------
         _groupByDefaultMethod: function (record) {
            var curField = record.get(this._options.groupBy.field),
               result = curField !== this._previousGroupBy;
            this._previousGroupBy = curField;
            return result;
         },
         _getGroupTpl: function () {
            return this._options.groupBy.template || groupByTpl;
         },
         _groupByDefaultRender: function (item, container) {
            return container;
         },
         setDataSource: function () {
            if (this._pager) {
               this._pager.destroy();
               this._pager = undefined;
            }
            this._destroyEditInPlace();
            ListView.superclass.setDataSource.apply(this, arguments);
         },

         _activateItem : function(id) {
            var
               item = this._dataSet.getRecordByKey(id);
            this._notify('onItemActivate', {id: id, item: item});
         },
         _beginAdd: function() {
            return this.showEip();
         },
         _beginEdit: function(record) {
            var target = this._getItemsContainer().find('.js-controls-ListView__item[data-id="' + record.getKey() + '"]:first');
            return this.showEip(target, record);
         },
         _cancelEdit: function() {
            return this._getEditInPlace().endEdit();
         },
         _commitEdit: function() {
            return this._getEditInPlace().endEdit(true);
         },
         destroy: function () {
            this._destroyEditInPlace();
            if (this.isInfiniteScroll()) {
               if (this._isHeightGrowable()) {
                  this.getContainer().unbind('.wsInfiniteScroll');
               } else {
                  $(window).unbind('scroll.wsInfiniteScroll', this._onWindowScrollHandler);
               }
            }
            if (this._pager) {
               this._pager.destroy();
            }
            ListView.superclass.destroy.call(this);
         },
         /**
          * двигает элемент
          * Метод будет удален после того как перерисовка научится сохранять раскрытые узлы в дереве
          * @param {String} item  - идентифкатор первого элемента
          * @param {String} anchor - идентифкатор второго элемента
          * @param {Boolean} before - если true то вставит перед anchor иначе после него
          * @private
          */
         _moveItemTo: function(item, anchor, before){
            //TODO метод сделан специально для перемещения элементов, этот костыль надо удалить и переписать через _redraw
            var itemsContainer = this._getItemsContainer(),
               itemContainer = itemsContainer.find('tr[data-id="'+item+'"]'),
               anchor = itemsContainer.find('tr[data-id="'+anchor+'"]'),
               rows;

            if(before){
               rows = [anchor.prev(), itemContainer, anchor, itemContainer.next()];
               itemContainer.insertBefore(anchor);
            } else {
               rows = [itemContainer.prev(), anchor, itemContainer, anchor.next()];
               itemContainer.insertAfter(anchor);
            }
            this._ladderCompare(rows);
         },
         _ladderCompare: function(rows){
            //TODO придрот - метод нужен только для адекватной работы лесенки при перемещении элементов местами
            for (var i = 1; i < rows.length; i++){
               var upperRow = $('.controls-ladder', rows[i - 1]),
                  lowerRow = $('.controls-ladder', rows[i]);
               for (var j = 0; j < lowerRow.length; j++){
                  lowerRow.eq(j).toggleClass('ws-invisible', upperRow.eq(j).html() == lowerRow.eq(j).html());
               }
            }
         },
         /*DRAG_AND_DROP START*/
         _findDragDropContainer: function() {
            return this._getItemsContainer();
         },
         _getDragItems: function(key) {
            var keys = this._options.multiselect ? $ws.core.clone(this.getSelectedKeys()) : [];
            if ($.inArray(key, keys) < 0) {
               keys.push(key);
            }
            return keys;
         },
         _onDragStart: function(e) {
            //TODO: придумать как избавиться от второй проверки. За поля ввода DragNDrop происходить не должен.
            if (this._isShifted || $ws.helpers.instanceOfModule($(e.target).wsControl(), 'SBIS3.CONTROLS.TextBoxBase')) {
               return;
            }
            var
                target = $(e.target).closest('.controls-ListView__item'),
                id = target.data('id');
            if (id) {
               this.setCurrentElement(e, {
                  keys: this._getDragItems(id),
                  targetId: id,
                  target: target,
                  insertAfter: undefined
               });
            }
            //Предотвращаем нативное выделение текста на странице
            if (!$ws._const.compatibility.touch) {
               e.preventDefault();
            }
         },
         _callMoveOutHandler: function() {
         },
         _callMoveHandler: function(e) {
            var
                insertAfter,
                isCorrectDrop,
                currentElement = this.getCurrentElement(),
                target = $(e.target).closest('.js-controls-ListView__item');
            this._clearDragHighlight();
            if (target.length && target.data('id') != currentElement.targetId) {
               insertAfter = this._getDirectionOrderChange(e, target);
            }
            isCorrectDrop = this._notify('onDragMove', currentElement.keys, target.data('id'), insertAfter);
            if (isCorrectDrop !== false) {
               this._setDragTarget(target, insertAfter);
            }
            this._setAvatarPosition(e);
         },
         _setDragTarget: function(target, insertAfter) {
            var currentElement = this.getCurrentElement();
            if (target.length) {
               if (insertAfter === true && target.next().data('id') !== currentElement.targetId) {
                  target.addClass('controls-DragNDrop__insertAfter');
               } else if (insertAfter === false && target.prev().data('id') !== currentElement.targetId) {
                  target.addClass('controls-DragNDrop__insertBefore');
               }
            }
            currentElement.insertAfter = insertAfter;
            currentElement.target = target;
         },
         _getDirectionOrderChange: function(e, target) {
            return this._getOrderPosition(e.pageY - target.offset().top, target.height());
         },
         _getOrderPosition: function(offset, metric) {
            return offset < 10 ? false : offset > metric - 10 ? true : undefined;
         },
         _createAvatar: function(e){
            var count = this.getCurrentElement().keys.length;
            this._avatar = $('<div class="controls-DragNDrop__draggedItem"><span class="controls-DragNDrop__draggedCount">' + count + '</span></div>')
                .css('z-index', $ws.single.WindowManager.acquireZIndex(false)).appendTo($('body'));
            this._setAvatarPosition(e);
         },
         _setAvatarPosition: function(e) {
            this._avatar.css({
               'left': e.pageX + DRAG_AVATAR_OFFSET,
               'top': e.pageY + DRAG_AVATAR_OFFSET
            });
         },
         _callDropHandler: function(e) {
            var
                clickHandler,
                currentElement = this.getCurrentElement(),
                targetId = currentElement.target.data('id');
            //TODO придрот для того, чтобы если перетащить элемент сам на себя не отработал его обработчик клика
            if (this.getSelectedKey() == targetId) {
               clickHandler = this._elemClickHandler;
               this._elemClickHandler = function() {
                  this._elemClickHandler = clickHandler;
               }
            }
            this._move(currentElement.keys, targetId, currentElement.insertAfter);
         },
         _beginDropDown: function(e) {
            this.setSelectedKey(this.getCurrentElement().targetId);
            this._isShifted = true;
            this._createAvatar(e);
            this._hideItemActions();
         },
         _clearDragHighlight: function() {
            this.getCurrentElement().target.removeClass('controls-DragNDrop__insertBefore controls-DragNDrop__insertAfter');
         },
         _endDropDown: function() {
            var hoveredItem = this.getHoveredItem();
            $ws.single.WindowManager.releaseZIndex(this._avatar.css('z-index'));
            this._clearDragHighlight();
            this._avatar.remove();
            this._isShifted = false;
            if (this.getItemsActions() && hoveredItem.container) {
               this._showItemActions(hoveredItem);
            }
         },
         _drawResults: function(){
            if (!this._checkResults()){
               return;
            }
            var resultRow = this._makeResultsTemplate(this._getResultsData());
            this._appendResultsContainer(this._getItemsContainer(), resultRow);
         },
         _checkResults: function(){
            return this._options.resultsPosition !== 'none' && this.getDataSet().getCount();
         },
         _makeResultsTemplate: function(resultsData){
            var self = this;
            return MarkupTransformer(TemplateUtil.prepareTemplate(this._options.resultsTpl)({
               results: resultsData,
               multiselect: self._options.multiselect
            }));
         },
         _getResultsData: function(){
            return this.getDataSet().getMetaData().results;
         },
         _appendResultsContainer: function(container, resultRow){
            if (!resultRow){
               return;
            }
            var position = this._options.resultsPosition == 'top' ? 'prepend' : 'append',
               drawnResults = $('.controls-DataGridView__results', container);
            if (drawnResults.length){
               $('[data-component]', drawnResults).each(function(i, item) {
                  var inst = $(item).wsControl();
                  inst.destroy();
               });
               drawnResults.remove();
            }
            $(container)[position](resultRow);
         }
         /*DRAG_AND_DROP END*/
      });

      return ListView;

   });
