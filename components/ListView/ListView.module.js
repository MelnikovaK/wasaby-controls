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
      'js!SBIS3.CONTROLS.ItemsToolbar',
      'js!SBIS3.CORE.MarkupTransformer',
      'html!SBIS3.CONTROLS.ListView',
      'js!SBIS3.CONTROLS.Utils.TemplateUtil',
      'js!SBIS3.CONTROLS.CommonHandlers',
      'js!SBIS3.CONTROLS.MoveHandlers',
      'js!SBIS3.CONTROLS.Pager',
      'js!SBIS3.CONTROLS.EditInPlaceHoverController',
      'js!SBIS3.CONTROLS.EditInPlaceClickController',
      'js!SBIS3.CONTROLS.Link',
      'js!SBIS3.CONTROLS.ScrollWatcher',
      'i18n!SBIS3.CONTROLS.ListView',
      'browser!html!SBIS3.CONTROLS.ListView/resources/ListViewGroupBy',
      'browser!html!SBIS3.CONTROLS.ListView/resources/emptyData',
      'browser!js!SBIS3.CONTROLS.ListView/resources/SwipeHandlers'
   ],
   function (CompoundControl, CompoundActiveFixMixin, DSMixin, MultiSelectable,
             Selectable, DataBindMixin, DecorableMixin, DragNDropMixin, ItemsToolbar, MarkupTransformer, dotTplFn,
             TemplateUtil, CommonHandlers, MoveHandlers, Pager, EditInPlaceHoverController, EditInPlaceClickController,
             Link, ScrollWatcher, rk,  groupByTpl, emptyDataTpl) {

      'use strict';

      var
         DRAG_AVATAR_OFFSET = 5,
         START_NEXT_LOAD_OFFSET = 180;

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
       * @cssModifier controls-ListView__bottomStyle Оформляет операции строки под строкой
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
          * Т.е. при любой вспомогательной загрузке данных.
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
          * @event onBeginAdd Возникает перед началом добавления записи по месту
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @returns {Object|SBIS3.CONTROLS.Data.Model} Данные которые попадут в поля созданного элемента.
          */
         /**
          * @event onAfterBeginEdit Возникает после начала редактирования (при непосредственном его начале)
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} model Редактируемая модель
          */
         /**
          * @event onEndEdit Возникает перед окончанием редактирования (и перед валидацией области редактирования).
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {SBIS3.CONTROLS.Data.Model} model Редактируемая модель.
          * @param {Boolean} withSaving Признак, по которому определяют тип завершения редактирования.
          * true - редактирование завершается сохранением изменений; false - отмена сохранения изменений путём нажатия клавиши Esc или переводом фокуса на другой контрол.
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
         /**
          * @event onPrepareFilterOnMove При определении фильтра, с которым будет показан диалог перемещения.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Array} records Список перемещаемых записей.
          * @returns {Object} filter Фильтр который будет помещёт в диалог перемещения.
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
            _pageChangeDeferred : undefined,
            _pager : undefined,
            _previousGroupBy : undefined,
            _checkClickByTap: true,
            _keysWeHandle: [
               $ws._const.key.up,
               $ws._const.key.down,
               $ws._const.key.space,
               $ws._const.key.enter,
               $ws._const.key.right,
               $ws._const.key.left,
               $ws._const.key.m,
               $ws._const.key.o
            ],
            _itemsToolbar: null,
            _editingItem: {
               target: null,
               model: null
            },
            _emptyData: undefined,
            _containerScrollHeight : 0,
            _firstScrollTop : true,
            _addResultsMethod: undefined,
            _options: {
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
                * @property {String} parent Идентификатор родительского пункта меню (name). Опция задаётся для подменю.
                * @property {String} tooltip Всплывающая подсказка.
                * @property {Boolean} isMainAction Отображать ли кнопку на строке или только выпадающем в меню.
                * На строке кнопки отображаются в том же порядке, в каком они перечислены.
                * На строке может быть только три кнопки, полный список будет в меню.
                * @property {Function} onActivated Действие кнопки.
                * @editor icon ImageEditor
                * @translatable caption tooltip
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
                  tooltip: rk('Удалить'),
                  caption: rk('Удалить'),
                  isMainAction: true,
                  onActivated: function (item) {
                     this.deleteRecords(item.data('id'));
                  }
               },{
                  name: 'move',
                  icon: 'sprite:icon-16 icon-Move icon-primary action-hover',
                  tooltip: rk('Перенести'),
                  caption: rk('Перенести'),
                  isMainAction: false,
                  onActivated: function (item) {
                     this.moveRecordsWithDialog([item.data('id')]);
                  }
               }],
               /**
                * @cfg {String} Разрешено или нет перемещение элементов "Drag-and-Drop"
                * @variant "" Запрещено
                * @variant allow Разрешено
                * @example
                * <pre>
                *     <option name="itemsDragNDrop">allow</option>
                * </pre>
                */
               itemsDragNDrop: 'allow',
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
                * @cfg {String|null} Подгружать ли данные по скроллу
                * @remark
                * По умолчанию, подгрузка осуществялется "вниз". Мы поскроллили и записи подгрузились вниз.
                * Но можно настроить скролл так, что записи будут загружаться по скроллу к верхней границе контейнера.
                * Важно. Запросы к БЛ все так же будут уходить с увеличением номера страницы. V
                * Может использоваться для загрузки систории сообщений, например.
                * @variant down - подгружать данные при достижении дна контейнера (подгрузка "вниз")
                * @variant up - подгружать данные при достижении верха контейнера (подгрузка "вверх")
                * @variant null - не загружать данные по скроллу
                *
                * @example
                * <pre>
                *    <option name="infiniteScroll">down</option>
                * </pre>
                * @see isInfiniteScroll
                * @see setInfiniteScroll
                */
               infiniteScroll: null,
               /**
                * @cfg {jQuery || String} Контейнер в котором будет скролл, если представление данных ограничено по высоте.
                * Можно передать Jquery-селектор, но поиск будет произведен от контейнера вверх.
                * @see isInfiniteScroll
                * @see setInfiniteScroll
                */
               infiniteScrollContainer: undefined,
               /**
                * @cfg {Boolean} Режим постраничной навигации
                * @remark
                * При частичной постраничной навигации заранее неизвестно общее количество страниц, режим пейджинга будет определн по параметру n из dataSource
                * Если пришел boolean, значит частичная постраничная навигация
                * Важно! В SBIS3.CONTROLS.TreeCompositeView особый режим навигации - в плоском списке и таблице автоматически работает
                * бесконечная подгрузка по скроллу (@see infiniteScroll), а вот в режиме плитки (tile) будет работать постраничная навигация
                * (при условии showPaging = true)
                * @example
                * <pre>
                *     <option name="showPaging">true</option>
                * </pre>
                * @see setPage
                * @see getPage
                * @see infiniteScroll
                * @see SBIS3.CONTROLS.TreeCompositeView
                */
               showPaging: false,
               /**
                * @cfg {String} Режим редактирования по месту
                * @variant "" Редактирование по месту отлючено
                * @variant click Отображение редактирования по клику
                * @variant hover Отображение редактирования по наведению мыши
                * @variant autoadd Включение режима автоматического добавления
                * @variant toolbar Отображение панели инструментов при входе в режим редактирования записи
                * @remark
                * Режим автоматического добавления позволяет при завершении редактирования последнего элемента автоматически создавать новый.
                * Режимы можно группировать и таким образом получать совмещенное поведение, например:
                *     <opt name="editMode">click|toolbar</opt>
                * задает редактирование по клику и отображает панель инструментов при входе в режим редактирования записи.
                * @example
                * <pre>
                *     <opt name="editMode">click</opt>
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
            },
            _scrollWatcher : undefined
         },

         $constructor: function () {
            this._touchSupport = $ws._const.browser.isMobilePlatform;
            //TODO временно смотрим на TopParent, чтобы понять, где скролл. С внедрением ScrallWatcher этот функционал уберем
            var topParent = this.getTopParent();
            this._publish('onChangeHoveredItem', 'onItemClick', 'onItemActivate', 'onDataMerge', 'onItemValueChanged', 'onBeginEdit', 'onAfterBeginEdit', 'onEndEdit', 'onBeginAdd', 'onAfterEndEdit', 'onPrepareFilterOnMove');
            this._container.on('mousemove', this._mouseMoveHandler.bind(this))
                           .on('mouseleave', this._mouseLeaveHandler.bind(this));

            this.initEditInPlace();
            this.setItemsDragNDrop(this._options.itemsDragNDrop);
            $ws.single.CommandDispatcher.declareCommand(this, 'activateItem', this._activateItem);
            $ws.single.CommandDispatcher.declareCommand(this, 'beginAdd', this._beginAdd);
            $ws.single.CommandDispatcher.declareCommand(this, 'beginEdit', this._beginEdit);
            $ws.single.CommandDispatcher.declareCommand(this, 'cancelEdit', this._cancelEdit);
            $ws.single.CommandDispatcher.declareCommand(this, 'commitEdit', this._commitEdit);
         },

         init: function () {
            if (typeof this._options.pageSize === 'string') {
               this._options.pageSize = this._options.pageSize * 1;
            }
            this.setGroupBy(this._options.groupBy, false);
            this._drawEmptyData();
            this._prepareInfiniteScroll();
            ListView.superclass.init.call(this);
            this.reload();
            if (this._touchSupport){
               /* События нужно вешать на контейнер контрола,
                  т.к. getItemsContainer возвращает текущий активный контейнер,
                  а в случае плиточного реестра их два, поэтому в одном из режимов могут не работать обработчики */
               this._container
                  .bind('swipe', this._swipeHandler.bind(this))
                  .bind('tap', this._tapHandler.bind(this))
                  .bind('touchmove',this._mouseMoveHandler.bind(this));
            }
         },
         _modifyOptions : function(opts){
            var lvOpts = ListView.superclass._modifyOptions.apply(this, arguments);
            //Если нам задали бесконечный скролл в виде Bool, то если true, то 'down' иначе null
            if (lvOpts.hasOwnProperty('infiniteScroll')){
               lvOpts.infiniteScroll = typeof lvOpts.infiniteScroll === 'boolean' ?
                  (lvOpts.infiniteScroll ? 'down' : null) :
                  lvOpts.infiniteScroll;
            }
            if (lvOpts.hasOwnProperty('itemsDragNDrop')) {
               if (typeof lvOpts.itemsDragNDrop === 'boolean') {
                  lvOpts.itemsDragNDrop = lvOpts.itemsDragNDrop ? 'allow' : '';
               }
            }
            return lvOpts;
         },
         _prepareInfiniteScroll: function(){
            var topParent = this.getTopParent(),
                  self = this,
                  scrollWatcherCfg = {};
            if (this.isInfiniteScroll()) {
               this._createLoadingIndicator();
               //для подгрузки вверх пока поставим 0 - иначе при постоянной прокрутке может сразу много данных
               //загрузиться - будет некрасиво доскроллено
               scrollWatcherCfg.checkOffset = this._options.infiniteScroll === 'down' ?  START_NEXT_LOAD_OFFSET : 0;
               scrollWatcherCfg.opener = this;
               if (this._options.infiniteScrollContainer) {
                  this._options.infiniteScrollContainer = this._options.infiniteScrollContainer instanceof jQuery
                        ? this._options.infiniteScrollContainer
                        : this.getContainer().closest(this._options.infiniteScrollContainer);
                  scrollWatcherCfg.element = this._options.infiniteScrollContainer;
               }
               /**TODO Это специфическое решение из-за того, что нам нужно догружать данные пока не появится скролл
                * Если мы находися на панельке, то пока она скрыта все данные уже могут загрузиться, но новая пачка не загрузится
                * потому что контейнер невидимый*/
               if ($ws.helpers.instanceOfModule(topParent, 'SBIS3.CORE.FloatArea')){
                  this._isLoadBeforeScrollAppears = false;
                  topParent.once('onAfterShow', function(){
                     self._isLoadBeforeScrollAppears = true;
                     self._firstScrollTop = true;
                     if (self._dataSet) {
                        self._preScrollLoading();
                     }
                  });
               }

               this._scrollWatcher = new ScrollWatcher(scrollWatcherCfg);
               this._scrollWatcher.subscribe('onScroll', function(event, type){
                  //top || bottom
                  self._loadChecked((type === 'top' && self._options.infiniteScroll === 'up') ||
                     (type === 'bottom' && self._options.infiniteScroll === 'down'));
               });
            }
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
                  if(selectedKey) {
                     var selectedItem = $('[data-id="' + selectedKey + '"]', this._getItemsContainer());
                     this._elemClickHandler(selectedKey, this._dataSet.getRecordByKey(selectedKey), selectedItem);
                  }
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
          * @returns {jQuery}
          */
         getNextItemById: function (id) {
            return this._getHtmlItemByProjectionItem(
               this._getProjectionItem(id, true)
            );
         },
         /**
          * Возвращает предыдущий элемент
          * @param id
          * @returns {jQuery}
          */
         getPrevItemById: function (id) {
            return this._getHtmlItemByProjectionItem(
               this._getProjectionItem(id, false)
            );
         },

         _getNextItemByDOM: function(id) {
            return this._getHtmlItemByDOM(id, true);
         },

         _getPrevItemByDOM: function(id) {
            return this._getHtmlItemByDOM(id, false);
         },

         _getProjectionItem: function(id, isNext) {
            var enumerator = this._itemsProjection.getEnumerator(),
               index = enumerator.getIndexByValue(this._options.keyField, id),
               item = enumerator.at(index);

            return this._itemsProjection[isNext ? 'getNext' : 'getPrevious'](item);
         },

         _getHtmlItemByProjectionItem: function (item) {
            if (item) {
               return $('.js-controls-ListView__item[data-id="' + item.getContents().getId() + '"]', this._getItemsContainer());
            }
            return undefined;
         },
         /**
          *
          * @param id - идентификатор элемента
          * @param isNext - если true вернет следующий элемент, false - предыдущий, undefined - текущий
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
            else if (isNext === false) {
               if (index > 0) {
                  siblingItem = items.eq(index - 1);
               }
            } else {
               siblingItem = items.eq(index);
            }
            if (siblingItem)
               return this._dataSet.getRecordByKey(siblingItem.data('id')) ? siblingItem : this._getHtmlItemByDOM(siblingItem.data('id'), isNext);
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
            if (!Object.isEmpty(this._options.groupBy) && this._options.groupBy.clickHandler instanceof Function) {
               var closestGroup = $target.closest('.controls-GroupBy', this._getItemsContainer());
               this._options.groupBy.clickHandler.call(this, $target);
            }
         },
         /**
          * Обрабатывает перемещения мышки на элемент представления
          * @param e
          * @private
          */
         _mouseMoveHandler: function (e) {
            var $target = $(e.target),
                target, targetKey, hoveredItem, hoveredItemClone;

            target = this._findItemByElement($target);

            if (target.length) {
               targetKey = target[0].getAttribute('data-id');
               if (targetKey !== undefined && this._hoveredItem.key !== targetKey) {
                  this._hoveredItem.container && this._hoveredItem.container.removeClass('controls-ListView__hoveredItem');
                  target.addClass('controls-ListView__hoveredItem');
                  this._hoveredItem = this._getElementData(target);
                  this._notifyOnChangeHoveredItem();
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
                  record: this.getItems().getRecordById(targetKey),
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

         _notifyOnChangeHoveredItem: function() {
            /* Надо делать клон и отдавать наружу только клон объекта, иначе,
               если его кто-то испортит, испортится он у всех, в том числе и у нас */
            var hoveredItemClone = $ws.core.clone(this._hoveredItem);
            this._notify('onChangeHoveredItem', hoveredItemClone);
            this._onChangeHoveredItem(hoveredItemClone);
         },

         /**
          * Проверяет, относится ли переданный элемент,
          * к контролам которые отображаются по ховеру.
          * @param {jQuery} $target
          * @returns {boolean}
          * @private
          */
         _isHoverControl: function ($target) {
            var itemsToolbarContainer = this._itemsToolbar && this._itemsToolbar.getContainer();
            return itemsToolbarContainer && (itemsToolbarContainer[0] === $target[0] || $.contains(itemsToolbarContainer[0], $target[0]));
         },
         /**
          * Обрабатывает уведение мышки с элемента представления
          * @private
          */
         _mouseLeaveHandler: function () {
            var hoveredItem = this.getHoveredItem(),
                emptyHoveredItem;

            if (hoveredItem.container === null) {
               return;
            }

            emptyHoveredItem = this._clearHoveredItem();
            this._notify('onChangeHoveredItem', emptyHoveredItem);
            this._onChangeHoveredItem(emptyHoveredItem);
         },
         /**
          * Обработчик на смену выделенного элемента представления
          * @private
          */
         _onChangeHoveredItem: function (target) {
            if (this._isSupportedItemsToolbar()) {
         		if (target.container && !this._touchSupport){
                  this._showItemsToolbar(target);
               } else {
                  this._hideItemsToolbar();
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
            if(this._emptyData && this._emptyData.length) {
               if(html) {
                  this._emptyData.empty().html(html)
               } else {
                  this._emptyData.remove();
                  this._emptyData = undefined;
               }
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
         _getItemContainer: function(parent, item) {
            return parent.find('>[data-id="' + item.getKey() + '"]:not(".controls-editInPlace")');
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
               this._notifyOnItemClick(id, data, target);
            }
         },
         _notifyOnItemClick: function(id, data, target) {
            var
                self = this,
                elClickHandler = this._options.elemClickHandler,
                res = this._notify('onItemClick', id, data, target);
            if (res instanceof $ws.proto.Deferred) {
               res.addCallback(function(result) {
                  if (!result) {
                     self._elemClickHandlerInternal(data, id, target);
                     elClickHandler && elClickHandler.call(self, id, data, target);
                  }
               });
            } else if (res !== false) {
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

         _drawSelectedItem: function (id, index) {
            var selId;
            if (this._itemsProjection) {
               var selItem = this._itemsProjection.at(index);
               if (selItem) {
                  selId = selItem.getContents().getId();
               }
            }
            $(".controls-ListView__item", this._container).removeClass('controls-ListView__item__selected');
            $(".controls-ListView__item[data-id='" + selId + "']", this._container).addClass('controls-ListView__item__selected');
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
            this._firstScrollTop = true;
            this._hideItemsToolbar();
            this._destroyEditInPlace();
            return ListView.superclass.reload.apply(this, arguments);
         },
         _reloadInfiniteScrollParams : function(){
            if (this.isInfiniteScroll() || this._isAllowInfiniteScroll()) {
               this._hasScrollMore = true;
               this._infiniteScrollOffset = this._offset;
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
         //********************************//
         //   БЛОК РЕДАКТИРОВАНИЯ ПО МЕСТУ //
         //*******************************//
         _isHoverEditMode: function() {
            return !this._touchSupport && this._options.editMode.indexOf('hover') !== -1;
         },
         _isClickEditMode: function() {
            return this._options.editMode.indexOf('click') !== -1 || (this._touchSupport && this._options.editMode.indexOf('hover') !== -1);
         },
         initEditInPlace: function() {
            this._notifyOnItemClick = this.beforeNotifyOnItemClick();
            if (this._isHoverEditMode()) {
               this.subscribe('onChangeHoveredItem', this._onChangeHoveredItemHandler);
            } else if (this._isClickEditMode()) {
               this.subscribe('onItemClick', this._onItemClickHandler);
            }
         },
         beforeNotifyOnItemClick: function() {
            var handler = this._notifyOnItemClick;
            return function() {
               var args = arguments;
               if (this._hasEditInPlace()) {
                  this._getEditInPlace().endEdit(true).addCallback(function() {
                     handler.apply(this, args)
                  }.bind(this));
               } else {
                  handler.apply(this, args)
               }
            }
         },
         setEditMode: function(editMode) {
            if (editMode ==='' || editMode !== this._options.editMode) {
               if (this._isHoverEditMode()) {
                  this.unsubscribe('onChangeHoveredItem', this._onChangeHoveredItemHandler);
               } else if (this._isClickEditMode()) {
                  this.unsubscribe('onItemClick', this._onItemClickHandler);
               }
               this._destroyEditInPlace();
               this._options.editMode = editMode;
               if (this._isHoverEditMode()) {
                  this.subscribe('onChangeHoveredItem', this._onChangeHoveredItemHandler);
               } else if (this._isClickEditMode()) {
                  this.subscribe('onItemClick', this._onItemClickHandler);
               }
            }
         },

         getEditMode: function() {
            return this._options.editMode;
         },

         showEip: function(target, model, options) {
            if (this._canShowEip()) {
               return this._getEditInPlace().showEip(target, model, options);
            } else {
               return $ws.proto.Deferred.fail();
            }
         },

         _canShowEip: function() {
            // Отображаем редактирование только если enabled
            return this.isEnabled();
         },

         _setEnabled : function(enabled) {
            ListView.superclass._setEnabled.call(this, enabled);
            this._destroyEditInPlace();
         },

         _onItemClickHandler: function(event, id, record, target) {
            var result = this.showEip($(target).closest('.js-controls-ListView__item'), record, { isEdit: true });
            event.setResult(result);
         },

         _onChangeHoveredItemHandler: function(event, hoveredItem) {
            var target = hoveredItem.container;
            if (target && !(target.hasClass('controls-editInPlace') || target.hasClass('controls-editInPlace__editing'))) {
               this.showEip(target, this._dataSet.getRecordByKey(hoveredItem.key), { isEdit: false });
            } else {
               this._getEditInPlace().hide();
            }
         },

         redrawItem: function(item) {
            ListView.superclass.redrawItem.apply(this, arguments);
            if (this._editingItem.model && this._editingItem.model.getKey() === item.getKey()) {
               this._editingItem.target = this._getElementByModel(item);
            }
            //TODO: Временное решение для .100.  В .30 состояния выбранности элемента должны добавляться в шаблоне.
            this._drawSelectedItems(this.getSelectedKeys());
            this._drawSelectedItem(this.getSelectedKey());
         },

         /**
          * @private
          */
         _getEditInPlace: function() {
            if (!this._hasEditInPlace()) {
               this._createEditInPlace();
            }
            return this._editInPlace;
         },

         _hasEditInPlace: function() {
            return !!this._editInPlace;
         },

         _createEditInPlace: function() {
            var
               controller = this._isHoverEditMode() ? EditInPlaceHoverController : EditInPlaceClickController;
            this._editInPlace = new controller(this._getEditInPlaceConfig());
         },

         _destroyEditInPlace: function() {
            if (this._hasEditInPlace()) {
               this._editInPlace.destroy();
               this._editInPlace = null;
            }
         },
         _getEditInPlaceConfig: function() {
            //todo Герасимов, Сухоручкин: для hover-режима надо передать в опции метод
            //options.editFieldFocusHandler = this._editFieldFocusHandler.bind(this) - подумать, как это сделать
            var
               config = {
                  dataSet: this._items,
                  editingItem: this._editingItem,
                  ignoreFirstColumn: this._options.multiselect,
                  dataSource: this._dataSource,
                  editingTemplate: this._options.editingTemplate,
                  itemsContainer: this._getItemsContainer(),
                  element: $('<div>'),
                  opener: this,
                  modeAutoAdd: this._options.editMode.indexOf('autoadd') !== -1,
                  handlers: {
                     onItemValueChanged: function(event, difference, model) {
                        event.setResult(this._notify('onItemValueChanged', difference, model));
                     }.bind(this),
                     onBeginEdit: function(event, model) {
                        event.setResult(this._notify('onBeginEdit', model));
                     }.bind(this),
                     onAfterBeginEdit: function(event, model) {
                        if (this._options.editMode.indexOf('toolbar') !== -1) {
                           this._getItemsToolbar().unlockToolbar();
                           //Отображаем кнопки редактирования
                           this._getItemsToolbar().showEditActions();
                           //Отображаем itemsToolbar для редактируемого элемента и фиксируем его
                           this._showItemsToolbar(this._getElementData(this._editingItem.target));
                           this._getItemsToolbar().lockToolbar();
                        }
                        this.setSelectedKey(model.getKey());
                        event.setResult(this._notify('onAfterBeginEdit', model));
                     }.bind(this),
                     onBeginAdd: function(event, options) {
                        event.setResult(this._notify('onBeginAdd', options));
                     }.bind(this),
                     onEndEdit: function(event, model, withSaving) {
                        event.setResult(this._notify('onEndEdit', model, withSaving));
                     }.bind(this),
                     onAfterEndEdit: function(event, model, target, withSaving) {
                        if (this._options.editMode.indexOf('toolbar') !== -1) {
                           //Скрываем кнопки редактирования
                           this._getItemsToolbar().unlockToolbar();
                           this._getItemsToolbar().hideEditActions();
                           this._hideItemsToolbar();
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
         _isSupportedItemsToolbar: function() {
            return this._options.itemsActions.length || this._options.editMode.indexOf('toolbar') !== -1;
         },

         _updateItemsToolbar: function() {
            var hoveredItem = this.getHoveredItem();

            if(hoveredItem.container && this._isSupportedItemsToolbar()) {
               this._showItemsToolbar(hoveredItem);
            }
         },

         _swipeHandler: function(e){
            var target = this._findItemByElement($(e.target)),
                item;

            if(!target.length) {
               return;
            }

            if (this._isSupportedItemsToolbar()) {
               item = this._getElementData(target);
               if (e.direction == 'left') {
                  item.container ? this._showItemsToolbar(item) : this._hideItemsToolbar();
                  this._hoveredItem = item;
               } else {
                  this._hideItemsToolbar(true);
               }
            }
         },

         _tapHandler: function(e){
            var target = this._findItemByElement($(e.target));

            if(target.length) {
               this.setSelectedKey(target.data('id'));
            }
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
            return elem[0] && this.getItems() && this.getItems().getRecordById(elem[0].getAttribute('data-id')) ? elem : this._findItemByElement(elem.parent());
         },
         /**
          * Показывает оперцаии над записью для элемента
          * @private
          */
         _showItemsToolbar: function(target) {
            this._getItemsToolbar().show(target, this._touchSupport);
         },
         _hideItemsToolbar: function (animate) {
            if (this._itemsToolbar) {
               this._itemsToolbar.hide(animate);
            }
         },
         _getItemsToolbar: function() {
            if (!this._itemsToolbar) {
               this._itemsToolbar = new ItemsToolbar({
                  element: $('<div class="controls-ListView__ItemsToolbar-container"/>').appendTo(this.getContainer()),
                  parent: this,
                  touchMode: this._touchSupport,
                  itemsActions: this._options.itemsActions,
                  showEditActions: this._options.editMode.indexOf('toolbar') !== -1
               });
            }
            return this._itemsToolbar;
         },
         /**
          * Метод получения операций над записью.
          * @returns {Object} Компонент "операции над записью".
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
          */
         getItemsActions: function () {
            return this._getItemsToolbar().getItemsActions();
         },
         /**
          * Метод установки или замены кнопок операций над записью, заданных в опции {@link itemsActions}
          * @remark
          * В метод нужно передать массив обьектов.
          * @param {Array} itemsActions Объект формата {name: ..., icon: ..., caption: ..., onActivated: ..., isMainOption: ...}
          * @param {String} itemsActions.name Имя кнопки операции над записью.
          * @param {String} itemsActions.icon Иконка кнопки.
          * @param {String} itemsActions.caption Текст на кнопке.
          * @param {String} itemsActions.onActivated Обработчик клика по кнопке.
          * @param {String} itemsActions.tooltip Всплывающая подсказка.
          * @param {String} itemsActions.title Текст кнопки в выпадающем меню.
          * @param {String} itemsActions.isMainOption На строке ли кнопка (или в меню).
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
         setItemsActions: function (itemsActions) {
            this._options.itemsActions = itemsActions;
            this._getItemsToolbar().setItemsActions(this._options.itemsActions);
            if(this.getHoveredItem().container) {
               this._notifyOnChangeHoveredItem()
            }
         },
         //**********************************//
         //КОНЕЦ БЛОКА ОПЕРАЦИЙ НАД ЗАПИСЬЮ //
         //*********************************//
         _drawItems: function(records, at){
            //Это реализовано здесь, потому что 1ый раз отрисовка вызвана не после подгрузки в
            // бесконечном скролле, а после первого получения данных!
            if (this._options.infiniteScroll === 'up' && !at) {
               at = {at : 0};
            }
            ListView.superclass._drawItems.apply(this, [records, at]);
         },
         _drawItemsCallback: function () {
            ListView.superclass._drawItemsCallback.apply(this, arguments);
            var hoveredItem = this.getHoveredItem().container;

            if (this.isInfiniteScroll()) {
               this._preScrollLoading();
            }
            this._drawSelectedItems(this._options.selectedKeys);

            /* Если после перерисовки выделенный элемент удалился из DOM дерава,
               то событие mouseLeave не сработает, поэтому вызовем руками метод */
            if(hoveredItem && !$.contains(this._getItemsContainer()[0], hoveredItem[0])) {
               this._mouseLeaveHandler();
            }

            this._notifyOnSizeChanged(true);
            this._drawResults();
            this._needToRedraw = true;
         },
         _removeItem: function(item){
            ListView.superclass._removeItem.call(this, item);
            this._isLoadBeforeScrollAppears = true;
            this._preScrollLoading();
         },
         //-----------------------------------infiniteScroll------------------------
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
         _cancelLoading: function(){
            ListView.superclass._cancelLoading.apply(this, arguments);
            if (this._isAllowInfiniteScroll()){
               this._hideLoadingIndicator();
            }
         },
         _nextLoad: function () {
            var self = this,
               loadAllowed  = this._isAllowInfiniteScroll(),
               records = [];
            //Если в догруженных данных в датасете пришел n = false, то больше не грузим.
            if (loadAllowed && $ws.helpers.isElementVisible(this.getContainer()) &&
                  this._hasNextPage(this._dataSet.getMetaData().more, this._infiniteScrollOffset) && this._hasScrollMore && !this._isLoading()) {
               this._showLoadingIndicator();
               this._notify('onBeforeDataLoad', this.getFilter(), this.getSorting(), this._infiniteScrollOffset + this._limit, this._limit);
               this._loader = this._callQuery(this.getFilter(), this.getSorting(), this._infiniteScrollOffset + this._limit, this._limit).addCallback($ws.helpers.forAliveOnly(function (dataSet) {
                  //ВНИМАНИЕ! Здесь стрелять onDataLoad нельзя! Либо нужно определить событие, которое будет
                  //стрелять только в reload, ибо между полной перезагрузкой и догрузкой данных есть разница!
                  self._loader = null;

                  self._hideLoadingIndicator();

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
                     //TODO вскрылась проблема  проекциями, когда нужно рисовать какие-то определенные элементы и записи
                     //Возвращаем самостоятельную отрисовку данных, пришедших в загрузке по скроллу
                     self._needToRedraw = false;
                     //TODO перевести на each
                     records = dataSet.toArray();
                     if (self._options.infiniteScroll === 'up') {
                        self._containerScrollHeight = self._scrollWatcher.getScrollHeight();
                        //TODO Провести тесты с unshift и Array.insert
                        //сортируем пришедшие данные в обратном порядке, чтобы красиво отрисовать
                        records = records.reverse();
                     }
                     self._items[self._options.infiniteScroll === 'up' ? 'prepend' : 'append'](records);
                     self._drawItems(records);
                     //TODO Пытались оставить для совместимости со старыми данными, но вызывает onCollectionItemChange!!!
                     //self._dataSet.merge(dataSet, {remove: false});
                     self._dataLoadedCallback();
                     self._toggleEmptyData();
                     self._needToRedraw = true;
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
         /**
          * Функция догрузки данных пока не появится скролл.Если появился и мы грузили и дорисовывали вверх, нужно поуправлять скроллом.
          * @private
          */
         _preScrollLoading: function(){
            /**
             * Если у нас автовысота, то подгружать данные надо пока размер контейнера не привысит размеры экрана (контейнера window)
             * Если же высота фиксированная, то подгружать данные в этой функции будем пока высота контейнера(ту, что фиксированно задали) не станет меньше высоты таблицы(table),
             * т.е. пока не появится скролл внутри контейнера
             */
            if (this._isLoadBeforeScrollAppears && !this._scrollWatcher.hasScroll(this.getContainer())){
               this._nextLoad();
            } else {
               this._isLoadBeforeScrollAppears = false;
               this._moveTopScroll();
               this._firstScrollTop = false;
            }
         },
         /**
          * Управляет доскролливанием в режиме подгрузки вверх
          * При подгрузке данных вверх необходимо подскролливать элементы, чтобы
          * @private
          */
         _moveTopScroll : function(){
            var scrollAmount;
            //сюда попадем только когда уже точно есть скролл
            if (this.isInfiniteScroll() && this._options.infiniteScroll == 'up'){
               scrollAmount = this._scrollWatcher.getScrollHeight() - this._containerScrollHeight;
               //Если запускаем 1ый раз, то нужно поскроллить в самый низ (ведь там "начало" данных), в остальных догрузках скроллим вниз на
               //разницы величины скролла (т.е. на сколько добавилось высоты, на столько и опустили). Получается плавно
               //Так же цчитываем то, что индикатор появляется только на время загрузки и добавляет свою высоту
               this._scrollWatcher.scrollTo(this._firstScrollTop || (scrollAmount < 0) ? 'bottom' : scrollAmount);
            }
         },
         /**
          * Если высота контейнера меньше высоты экрана (т.е. нет скролла в контейнере иди в окне),
          * то будет загружать данные, пока скролл все-таки не появится.
          * Работает в паре с взведенной опцией infiniteScroll
          * @remark Работает только в 3.7.3.30
          * @see infiniteScroll
          * @deprecated Удалено в 3.7.3.100.
          */
         loadDataTillScroll : function(){
            $ws.single.ioc.resolve('ILogger').log('loadDataTillScroll', 'Метод работает только в 3.7.3.30, просьба исправить свой функционал');
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
          * @see getItemsActions
          */
         getHoveredItem: function () {
            return this._hoveredItem;
         },

         /**
          * Устанавливает текущий выделенный элемент
          * @param {Object} hoveredItem
          * @private
          */
         _setHoveredItem: function(hoveredItem) {
            hoveredItem.container && hoveredItem.container.addClass('controls-ListView__hoveredItem');
            this._hoveredItem = hoveredItem;
         },

         /**
          * Очищает текущий выделенный элемент
          * @private
          */
         _clearHoveredItem: function() {
            var hoveredItem = this.getHoveredItem(),
                emptyObject = {};

            hoveredItem.container && hoveredItem.container.removeClass('controls-ListView__hoveredItem');
            for(var key in hoveredItem) {
               if(hoveredItem.hasOwnProperty(key)) {
                  emptyObject[key] = null;
               }
            }
            return (this._hoveredItem = emptyObject);

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
         /**
          * Выбирает элемент коллекции (модель/запись) по переданному идентификатору.
          * На выбранный элемент устанавливается маркер (оранжевая вертикальная черта) и изменяется фон.
          * При выполнении команды происходит события {@link onItemActivate} и {@link onSelectedItemChange}.
          * @param id Идентификатор элемента коллекции, который нужно выбрать.
          * @example
          * <pre>
          *    myListView.sendCommand('activateItem', myId);
          * </pre>
          * @private
          * @command activateItem
          * @see sendCommand
          */
         _activateItem : function(id) {
            var
               item = this._dataSet.getRecordByKey(id);
            this._notify('onItemActivate', {id: id, item: item});
         },
         _beginAdd: function(options, model) {
            return this.showEip(null, model, options);
         },
         /**
          * Запускает редактирования по месту.
          * Используется для запуска редактирования без клика пользователя по элементу коллекции.
          * При выполнении команды происходят события {@link onBeginEdit} и {@link onAfterBeginEdit}.
          * @param record Модель(элемент коллекции), для которой требуется запустить редактирование по месту.
          * @example
          * <pre>
          *    myListView.sendCommand('beginEdit', record);
          * </pre>
          * @private
          * @command beginEdit
          * @see sendCommand
          * @see cancelEdit
          * @see commitEdit
          */
         _beginEdit: function(record) {
            var target = this._getItemsContainer().find('.js-controls-ListView__item[data-id="' + record.getKey() + '"]:first');
            return this.showEip(target, record, { isEdit: true });
         },
         /**
          * Завершает редактирования по месту без сохранения измений.
          * При выполнении команды происходят события {@link onEndEdit} и {@link onAfterEndEdit}.
          * @example
          * <pre>
          *    myListView.sendCommand('cancelEdit');
          * </pre>
          * @private
          * @command cancelEdit
          * @see sendCommand
          * @see beginEdit
          * @see commitEdit
          */
         _cancelEdit: function() {
            return this._getEditInPlace().endEdit();
         },
         /**
          * Завершает редактирования по месту с сохранением измений.
          * При выполнении команды происходят события {@link onEndEdit} и {@link onAfterEndEdit}.
          * @example
          * <pre>
          *    myListView.sendCommand('commitEdit');
          * </pre>
          * @private
          * @command commitEdit
          * @see sendCommand
          * @see beginEdit
          * @see cancelEdit
          */
         _commitEdit: function() {
            return this._getEditInPlace().endEdit(true);
         },
         destroy: function () {
            this._destroyEditInPlace();
            if (this.isInfiniteScroll()) {
               this._scrollWatcher.destroy();
               this._scrollWatcher = undefined;
            }
            if (this._pager) {
               this._pager.destroy();
               this._pager = undefined;
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
         /*DRAG_AND_DROP START*/
         /**
          * Установить возможность перемещения элементов с помощью DragNDrop.
          * @param allowDragNDrop возможность перемещения элементов.
          * @see itemsDragNDrop
          * @see getItemsDragNDrop
          */
         setItemsDragNDrop: function(allowDragNDrop) {
            this._options.itemsDragNDrop = allowDragNDrop;
            if (!this._dragStartHandler) {
               this._dragStartHandler = this._onDragStart.bind(this);
            }
            this._getItemsContainer()[allowDragNDrop ? 'on' : 'off']('mousedown', '.js-controls-ListView__item', this._dragStartHandler);
         },
         /**
          * Получить текущую конфигурацию перемещения элементов с помощью DragNDrop.
          * @see itemsDragNDrop
          * @see setItemsDragNDrop
          */
         getItemsDragNDrop: function() {
            return this._options.itemsDragNDrop;
         },
         _findDragDropContainer: function() {
            return this._getItemsContainer();
         },
         _getDragItems: function(key) {
            var keys = this._options.multiselect ? $ws.core.clone(this.getSelectedKeys()) : [];
            if (Array.indexOf(keys, key) == -1 || Array.indexOf(keys, String(key)) == -1) {
               keys.push(key);
            }
            return keys;
         },
         _canDragStart: function(e) {
            //TODO: При попытке выделить текст в поле ввода, вместо выделения начинается перемещения элемента.
            //Как временное решение добавлена проверка на SBIS3.CONTROLS.TextBoxBase.
            //Необходимо разобраться можно ли на уровне TextBoxBase или Control для события mousedown
            //сделать stopPropagation, тогда от данной проверки можно будет избавиться.
            return !this._isShifted && this._options.enabled && !$ws.helpers.instanceOfModule($(e.target).wsControl(), 'SBIS3.CONTROLS.TextBoxBase');
         },
         _onDragStart: function(e) {
            var
                id,
                target;
            if (this._canDragStart(e)) {
               target = this._findItemByElement($(e.target));
               id = target.data('id');
               this.setCurrentElement(e, {
                  keys: this._getDragItems(id),
                  targetId: id,
                  target: target,
                  insertAfter: undefined
               });
               //Предотвращаем нативное выделение текста на странице
               if (!$ws._const.compatibility.touch) {
                  e.preventDefault();
               }
            }
         },
         _callMoveOutHandler: function() {
         },
         _callMoveHandler: function(e) {
            this._updateDragTarget(e);
            this._setAvatarPosition(e);
         },
         _updateDragTarget: function(e) {
            var
                insertAfter,
                neighborItem,
                currentElement = this.getCurrentElement(),
                target = this._findItemByElement($(e.target));

            this._clearDragHighlight();
            if (target.length && target.data('id') != currentElement.targetId) {
               insertAfter = this._getDirectionOrderChange(e, target);
               if (insertAfter !== undefined) {
                  neighborItem = this[insertAfter ? 'getNextItemById' : 'getPrevItemById'](target.data('id'));
                  if (neighborItem && neighborItem.data('id') == currentElement.targetId) {
                     insertAfter = undefined;
                  }
               }
               if (this._notifyOnDragMove(target, insertAfter)) {
                  currentElement.insertAfter = insertAfter;
                  currentElement.target = target;
                  this._drawDragHighlight(target, insertAfter);
               } else {
                  currentElement.insertAfter = currentElement.target = null;
               }
            } else {
               currentElement.insertAfter = currentElement.target = null;
            }
         },
         _notifyOnDragMove: function(target, insertAfter) {
            if (typeof insertAfter === 'boolean') {
               return this._notify('onDragMove', this.getCurrentElement().keys, target.data('id'), insertAfter) !== false;
            }
         },
         _clearDragHighlight: function() {
            var target = this.getCurrentElement().target;
            if (target) {
               target.removeClass('controls-DragNDrop__insertBefore controls-DragNDrop__insertAfter');
            }
         },
         _drawDragHighlight: function(target, insertAfter) {
            target.toggleClass('controls-DragNDrop__insertAfter', insertAfter === true);
            target.toggleClass('controls-DragNDrop__insertBefore', insertAfter === false);
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
                currentTarget = this._findItemByElement($(e.target));
            //После опускания мыши, ещё раз позовём обработку перемещения, т.к. в момент перед отпусканием мог произойти
            //переход границы между сменой порядкового номера и перемещением в папку, а обработчик перемещения не вызваться,
            //т.к. он срабатывают так часто, насколько это позволяет внутренняя система взаимодействия с мышью браузера.
            this._updateDragTarget(e);
            //TODO придрот для того, чтобы если перетащить элемент сам на себя не отработал его обработчик клика
            if (currentTarget.length && currentTarget.data('id') == this.getSelectedKey()) {
               clickHandler = this._elemClickHandler;
               this._elemClickHandler = function () {
                  this._elemClickHandler = clickHandler;
               }
            }
            if (currentElement.target) {
               this._move(currentElement.keys, currentElement.target.data('id'), currentElement.insertAfter);
            }
         },
         _beginDropDown: function(e) {
            this.setSelectedKey(this.getCurrentElement().targetId);
            this._isShifted = true;
            this._createAvatar(e);
            this._hideItemsToolbar();
         },
         _endDropDown: function() {
            $ws.single.WindowManager.releaseZIndex(this._avatar.css('z-index'));
            this._clearDragHighlight();
            this._avatar.remove();
            this._isShifted = false;
            this._updateItemsToolbar();
         },
         /*DRAG_AND_DROP END*/
         _drawResults: function(){
            if (!this._checkResults()){
               return;
            }
            var resultRow = this._makeResultsTemplate(this._getResultsData());
            if (resultRow){
               this._appendResultsContainer(this._getResultsContainer(), resultRow);
            }
         },
         _checkResults: function(){
            return this._options.resultsPosition !== 'none' && this._getResultsRecord() && this._options.resultsTpl;
         },
         _getResultsContainer: function(){
            return this._getItemsContainer();
         },
         _makeResultsTemplate: function(resultsData){
            if (!resultsData){
               return;
            }
            var item = this._getResultsRecord(),
               self = this;
            return MarkupTransformer(TemplateUtil.prepareTemplate(this._options.resultsTpl)({
               results: resultsData,
               item: item,
               columns: $ws.core.clone(self._options.columns),
               multiselect: self._options.multiselect
            }));
         },
         _getResultsData: function(){
            return this._getResultsRecord();
         },
         _getResultsRecord: function(){
            return this.getItems().getMetaData().results;
         },
         _appendResultsContainer: function(container, resultRow){
            var position = this._addResultsMethod || (this._options.resultsPosition == 'top' ? 'prepend' : 'append'),
               drawnResults = $('.controls-DataGridView__results', container);
            if (drawnResults.length){
               this._destroyControls(drawnResults);
               drawnResults.remove();
            }
            $(container)[position](resultRow);
         }
      });

      return ListView;

   });
