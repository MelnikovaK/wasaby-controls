/**
 * Created by iv.cheremushkin on 14.08.2014.
 */

define('js!SBIS3.CONTROLS.ListView',
   [
      'js!SBIS3.CORE.CompoundControl',
      'js!SBIS3.CORE.CompoundActiveFixMixin',
      'js!SBIS3.CONTROLS.ItemsControlMixin',
      'js!SBIS3.CONTROLS.MultiSelectable',
      'js!WS.Data/Query/Query',
      'js!WS.Data/Entity/Record',
      'js!SBIS3.CONTROLS.Selectable',
      'js!SBIS3.CONTROLS.DataBindMixin',
      'js!SBIS3.CONTROLS.DecorableMixin',
      'js!SBIS3.CONTROLS.DragNDropMixin',
      'js!SBIS3.CONTROLS.FormWidgetMixin',
      'js!SBIS3.CONTROLS.BreakClickBySelectMixin',
      'js!SBIS3.CONTROLS.ItemsToolbar',
      'js!SBIS3.CORE.MarkupTransformer',
      'tmpl!SBIS3.CONTROLS.ListView',
      'js!SBIS3.CONTROLS.Utils.TemplateUtil',
      'js!SBIS3.CONTROLS.CommonHandlers',
      'js!SBIS3.CONTROLS.MoveHandlers',
      'js!SBIS3.CONTROLS.Pager',
      'js!SBIS3.CONTROLS.EditInPlaceHoverController',
      'js!SBIS3.CONTROLS.EditInPlaceClickController',
      'js!SBIS3.CONTROLS.Link',
      'js!SBIS3.CONTROLS.ScrollWatcher',
      'js!WS.Data/Collection/IBind',
      'i18n!SBIS3.CONTROLS.ListView',
      'browser!html!SBIS3.CONTROLS.ListView/resources/ListViewGroupBy',
      'browser!tmpl!SBIS3.CONTROLS.ListView/resources/ItemTemplate',
      'browser!tmpl!SBIS3.CONTROLS.ListView/resources/ItemContentTemplate',
      'browser!tmpl!SBIS3.CONTROLS.ListView/resources/GroupTemplate',
      'browser!js!SBIS3.CONTROLS.Utils.InformationPopupManager',
      'js!SBIS3.CONTROLS.Paging',
      'js!SBIS3.CONTROLS.ComponentBinder',
      'js!WS.Data/Di',
      'browser!js!SBIS3.CONTROLS.ListView/resources/SwipeHandlers',
      'js!WS.Data/Collection/RecordSet'
   ],
   function (CompoundControl, CompoundActiveFixMixin, ItemsControlMixin, MultiSelectable, Query, Record,
             Selectable, DataBindMixin, DecorableMixin, DragNDropMixin, FormWidgetMixin, BreakClickBySelectMixin, ItemsToolbar, MarkupTransformer, dotTplFn,
             TemplateUtil, CommonHandlers, MoveHandlers, Pager, EditInPlaceHoverController, EditInPlaceClickController,
             Link, ScrollWatcher, IBindCollection, rk, groupByTpl, ItemTemplate, ItemContentTemplate, GroupTemplate, InformationPopupManager,
             Paging, ComponentBinder, Di) {

      'use strict';

      var
         buildTplArgsLV = function(cfg) {
            var tplOptions = cfg._buildTplArgsSt.call(this, cfg);
            tplOptions.multiselect = cfg.multiselect;
            tplOptions.decorators = cfg._decorators;
            tplOptions.colorField = cfg.colorField;

            return tplOptions;
         },
         getRecordsForRedrawLV = function (projection, cfg){
            var records = cfg._getRecordsForRedrawSt.call(this, projection);
            return records;
         };
      var
         DRAG_AVATAR_OFFSET = 5,
         START_NEXT_LOAD_OFFSET = 180;

      /**
       * Контрол, отображающий внутри себя набор однотипных сущностей.
       * Умеет отображать данные списком по определенному шаблону, а так же фильтровать и сортировать.
       * @class SBIS3.CONTROLS.ListView
       * @extends $ws.proto.CompoundControl
       * @author Крайнов Дмитрий Олегович
       * @mixes SBIS3.CONTROLS.ItemsControlMixin
       * @mixes SBIS3.CONTROLS.MultiSelectable
       * @mixes SBIS3.CONTROLS.Selectable
       * @mixes SBIS3.CONTROLS.DecorableMixin
       * @mixes SBIS3.CONTROLS.DataBindMixin
       * @control
       * @public
       * @cssModifier controls-ListView__orangeMarker Показывать маркер активной строки у элементов ListView. Актуально только для ListView.
       * @cssModifier controls-ListView__showCheckBoxes Чекбоксы показываются не по ховеру, а сразу все.
       * @cssModifier controls-ListView__hideCheckBoxes Скрыть все чекбоксы.
       * @cssModifier controls-ListView__bottomStyle Оформляет операции строки под строкой
       * @cssModifier controls-ListView__pagerNoSizePicker Скрыть выбор размера страницы в пейджинге.
       * @cssModifier controls-ListView__pagerNoAmount Скрыть отображение количества записей на странице в пейджинге.
       * @cssModifier controls-ListView__pagerHideEndButton Скрыть кнопку "Перейти к последней странице"
       * Т.е. текст "1-10" при отображении 10 записей на 1-ой странице
       *
       * @css controls-DragNDropMixin__notDraggable За помеченные данным селектором элементы Drag&Drop производиться не будет.
       */

      /*TODO CommonHandlers MoveHandlers тут в наследовании не нужны*/
      var ListView = CompoundControl.extend([CompoundActiveFixMixin, DecorableMixin, ItemsControlMixin, FormWidgetMixin, MultiSelectable, Selectable, DataBindMixin, DragNDropMixin, CommonHandlers, MoveHandlers], /** @lends SBIS3.CONTROLS.ListView.prototype */ {
         _dotTplFn: dotTplFn,
         /**
          * @event onChangeHoveredItem Происходит при переводе курсора мыши на другой элемент коллекции списка.
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} hoveredItem Объект, свойства которого описывают данные элемента коллекции списка, на который навели курсор мыши.
          * @param {WS.Data/Entity/Model} record Элемент коллекции, на который перевели курсор.
          * @param {Number|String} hoveredItem.key Первичный ключ элемента.
          * @param {jQuery|false} hoveredItem.container Контейнер визуального отображения элемента (DOM-элемент).
          * @param {Object} hoveredItem.position Объект, свойства которого описывают координаты контейнера визуального отображения элемента.
          * @param {Number} hoveredItem.position.top Отступ от верхней границы контейнера визуального отображения элемента до верхней границы контейнера визуального отображения списка. Значение в px. При расчете учитывается текущий скролл в списке.
          * @param {Number} hoveredItem.position.left Отступ от левой границы контейнера визуального отображения элемента до левой границы контейнера визуального отображения списка. Значение в px.
          * @param {Object} hoveredItem.size Объект, свойства которого описывают высоту и ширину контейнера визуального отображения элемента.
          * @param {Number} hoveredItem.size.height Высота контейнера визуального отображения элемента. Значение в px.
          * @param {Number} hoveredItem.size.width Ширина контейнера визуального отображения элемента. Значение в px.
          * @example
          * При наведении курсора мыши на запись справа от неё отображаются операции (см. <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/items-action/fast/">Быстрый доступ к операциям по наведению курсора</a>).
          * Ниже приведён код, с помощью которого можно изменять отображение набора операций для записей списка.
          * <pre>
          *    dataGrid.subscribe('onChangeHoveredItem', function(eventObject, hoveredItem) {
          *       var actions = DataGridView.getItemsActions(),
          *           instances = actions.getItemsInstances();
          *       for (var i in instances) {
          *          if (instances.hasOwnProperty(i)) {
          *             //Будем скрывать кнопку удаления для всех строк
          *             instances[i][i === 'delete' ? 'show' : 'hide']();
          *          }
          *       }
          *    });
          * </pre>
          * Подобная задача часто сводится к отображению различных операций для узлов, скрытых узлов и листьев для иерархических списков.
          * Пример конфигурации списка для решения подобной задачи вы можете найти в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/items-action/fast/mode/">здесь</a>.
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
          * @returns {Object|WS.Data/Entity/Model} Данные которые попадут в поля созданного элемента.
          */
         /**
          * @event onAfterBeginEdit Возникает после начала редактирования (при непосредственном его начале)
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {Object} model Редактируемая модель
          */
         /**
          * @typedef {String} EndEditResult
          * @variant Cancel Отменить завершение редактирования.
          * @variant Save Завершить редактирование с сохранением изменений.
          * @variant NotSave Завершить редактирование без сохранения изменений.
          */
         /**
          * @event onEndEdit Возникает перед окончанием редактирования (и перед валидацией области редактирования).
          * @param {$ws.proto.EventObject} eventObject Дескриптор события.
          * @param {WS.Data/Entity/Model} model Редактируемая модель.
          * @param {Boolean} withSaving Признак, по которому определяют тип завершения редактирования.
          * true - редактирование завершается сохранением изменений; false - отмена сохранения изменений путём нажатия клавиши Esc или переводом фокуса на другой контрол.
          * @returns {EndEditResult}
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
            _allowInfiniteScroll: true,
            _hoveredItem: {
               target: null,
               container: null,
               key: null,
               position: null,
               size: null
            },
            _loadingIndicator: undefined,
            _editInPlace: null,
            _scrollOffset: {
               top: null,
               bottom: null
            },
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
               $ws._const.key.o,
               $ws._const.key.del
            ],
            _itemsToolbar: null,
            _editingItem: {
               target: null,
               model: null
            },
            _notEndEditClassName: 'controls-ListView__onFocusNotEndEdit',
            _containerScrollHeight : 0,
            _firstScrollTop : true,
            _addResultsMethod: undefined,
            _options: {
               _canServerRender: true,
               _buildTplArgs: buildTplArgsLV,
               _getRecordsForRedraw: getRecordsForRedrawLV,
               _buildTplArgsLV: buildTplArgsLV,
               _defaultItemTemplate: ItemTemplate,
               _defaultItemContentTemplate: ItemContentTemplate,
               /**
                * @faq Почему нет чекбоксов в режиме множественного выбора значений (активация режима
                производится опцией {@link SBIS3.CONTROLS.ListView#multiselect multiselect})?
                * Для отрисовки чекбоксов необходимо в шаблоне отображения элемента коллекции обозначить их
                место.
                * Это делают с помощью CSS-классов "controls-ListView__itemCheckBox js-controls-
                ListView__itemCheckBox".
                * В следующем примере место отображения чекбоксом обозначено тегом span:
                * <pre>
                *     <div class="listViewItem" style="height: 30px;">
                *        <span class="controls-ListView__itemCheckBox js-controls-ListView__itemCheckBox"></span>
                *        {{=it.item.get("title")}}
                *     </div>
                * </pre>
                * @bind SBIS3.CONTROLS.ListView#itemTemplate
                * @bind SBIS3.CONTROLS.ListView#multiselect
                */
               /**
                * @cfg {String} Устанавливает шаблон отображения каждого элемента коллекции.
                * @remark
                * Шаблон - это пользовательская вёрстка элемента коллекции.
                * Для доступа к полям элемента коллекции в шаблоне подразумевается использование конструкций шаблонизатора.
                * Подробнее о шаблонизаторе вы можете прочитать в разделе {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/core/component/xhtml/template/ Шаблонизация вёрстки компонента}.
                *
                * Шаблон может быть создан в отдельном XHTML-файле, когда вёрстка большая или требуется использовать его в разных компонентах.
                * Шаблон создают в директории компонента в подпапке resources согласно правилам, описанным в разделе {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/core/component/file-structure/ Файловая структура компонента}.
                * Чтобы такой шаблон можно было использовать, нужно:
                * 1. Подключить шаблон в массив зависимостей компонента и импортировать его в переменную:
                *       <pre>
                *          define('js!SBIS3.MyArea.MyComponent',
                *             [
                *                ...
                *                'html!SBIS3.MyArea.MyComponent/resources/item_template'
                *             ],
                *             function(..., myItemTpl) {
                *             ...
                *          });
                *       </pre>
                * 2. Установить шаблон с помощью метода {@link setItemTemplate}:
                *       <pre>
                *          view = this.getChildControlByName('view');
                *          view.setItemTemplate(myItemTpl);
                *       </pre>
                * Пример содержимого шаблона элемента коллекции вы можете найти в разделе "Примеры".
                *
                * Когда установлен пользовательский шаблон отображения элемента коллекции, то в иерархическом представлении данных иконки для раскрытия содержимого папки будут скрыты.
                * Также будет отсутствовать отступ дочерних элементов относительно раскрытой папки, это отображение нужно реализовать в шаблоне самостоятельно.
                * @example
                * Далее приведён шаблон, который отображает значение поля title:
                * <pre>
                *     <div class="listViewItem" style="height: 30px;">
                *        {{=it.item.get("title")}}
                *     </div>
                * </pre>
                * @editor CloudFileChooser
                * @editorConfig extFilter xhtml
                * @see multiselect
                * @see setItemTemplate
                */
               itemTemplate: '',
               /**
                * @typedef {Array} ItemsActions
                * @property {String} name Уникальное имя кнопки. Обязательная для конфигурации подопция. Её значение, в том числе, может быть использовано в пользовательских обработчиках для отображения или скрытия набора операций.
                * @property {String} icon Иконка на кнопке. Необязательная подопция. В качестве значения в опцию передаётся строка, описывающая класс иконки.
                * Набор классов и список иконок, разрешённых для использования, можно найти <a href="https://wi.sbis.ru/docs/3-8-0/icons/">здесь</a>.
                * <ul>
                *    <li>Если кнопка отображается не в выпадающем меню (см. подопцию isMainAction) и установлена подопция icon, то использование подопции caption необязательно.</li>
                *    <li>Если кнопка отображается в выпадающем меню (см. подопцию isMainAction), то производят конфигурацию подопций icon и caption.</li>
                * </ul>
                * @property {String} caption Подпись на кнопке.
                * <ul>
                *    <li>Если кнопка отображается не в выпадающем меню (см. подопцию isMainAction) и установлена подопция icon, то использование подопции caption необязательно.</li>
                *    <li>Если кнопка отображается в выпадающем меню (см. подопцию isMainAction), то производят конфигурацию подопций icon и caption.</li>
                * </ul>
                * @property {String} tooltip Текст всплывающей подсказки.
                * @property {Boolean} isMainAction Признак, по которому устанавливается отображение кнопки в подменю.
                * @property {Function} onActivated Функция, которая будет выполнена при клике по кнопке. Внутри функции указатель this возвращает экземпляр класса представления данных. Аргументы функции:
                * <ul>
                *    <li>contaner - контейнер визуального отображения записи.</li>
                *    <li>id - идентификатор записи.</li>
                *    <li>item - запись (экземпляр класса {@link WS.Data/Entity/Model}).</li>
                * </ul>
                * @property {Boolean} allowChangeEnable Признак, по которому устанавливается возможность использования операций в случае, если взаимодействие с контролом запрещено (см. опцию {@link $ws.proto.Control#enabled}).
                * @editor icon ImageEditor
                * @translatable caption tooltip
                */
               /**
                * @cfg {ItemsActions[]} Набор действий над элементами, отображающийся в виде иконок при наведении курсора мыши на запись.
                * @remark
                * Если для контрола установлено значение false в опции {@link $ws.proto.Control#enabled}, то операции не будут отображаться при наведении курсора мыши.
                * Однако с помощью подопции allowChangeEnable можно изменить это поведение.
                * @example
                * <b>Пример 1.</b> Конфигурация операций через вёрстку компонента.
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
                * <b>Пример 2.</b> Конфигурация операций через JS-код компонента.
                * <pre>
                *     DataGridView.setItemsActions([{
                *        name: 'delete',
                *        icon: 'sprite:icon-16 icon-Erase icon-error',
                *        caption: 'Удалить',
                *        isMainAction: true,
                *        onActivated: function(item) {
                *           this.deleteRecords(item.data('id'));
                *        }
                *     }, {
                *        name: 'addRecord',
                *        icon: 'sprite:icon-16 icon-Add icon-error',
                *        caption: 'Добавить',
                *        isMainAction: true,
                *        onActivated: function(item) {
                *           this.showRecordDialog();
                *        }
                *     }]
                * <pre>
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
                * @cfg {String|Boolean} Устанавливает возможность перемещения элементов с помощью курсора мыши.
                * @variant "" Запрещено перемещение.
                * @variant allow Разрешено перемещение.
                * @variant false Запрещено перемещение.
                * @variant true Разрешено перемещение.
                * @example
                * Подробнее о способах передачи значения в опцию вы можете прочитать в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/core/component/xhtml/">Вёрстка компонента</a>.
                * <b>Пример 1.</b> Ограничим возможность перемещения записей с помощью курсора мыши.
                * <pre>
                *     <option name="itemsDragNDrop" value=""></option>      <!-- Передаём пустую строку в атрибуте value. Иным способом пустая строка не распознаётся -->
                *     <option name="itemsDragNDrop" value="false"></option> <!-- Первый способ передачи false -->
                *     <option name="itemsDragNDrop">false</option>          <!-- Второй способ передачи false -->
                * </pre>
                * <b>Пример 2.</b> Разрешим перемещение записей с помощью курсора мыши.
                * <pre>
                *     <option name="itemsDragNDrop" type="string" value="allow"></option> <!-- Первый способ передачи allow -->
                *     <option name="itemsDragNDrop" type="string">allow</option>          <!-- Второй способ передачи allow -->
                *     <option name="itemsDragNDrop" value="false"></option> <!-- Первый способ передачи true -->
                *     <option name="itemsDragNDrop">false</option>          <!-- Второй способ передачи true -->
                * </pre>
                */
               itemsDragNDrop: 'allow',
               /**
                * @cfg {Function} Устанавливает функцию, которая будет выполнена при клике на строку.
                * @remark
                * Аргументы функции:
                * <ol>
                *    <li>id - идентификатор элемента коллекции - строки, по которой был произведён клик.</li>
                *    <li>item - элемент коллекции, по строке отображения которого был произведён клик; экземпляр класса {@link WS.Data/Entity/Record} с данными выбранной записи.</li>
                *    <li>target - контейнер визуального отображения (DOM-элемент) строки, по которой был произведён клик.</li>
                * </ol>
                * Установить или заменить функцию - обработчик клика на строку можно с помощью метода {@link setElemClickHandler}
                * @example
                * <pre class="brush: xml">
                *     <option name="elemClickHandler" type="function">js!SBIS3.Contacts.LatestThemes:prototype.elemClickHandler</option>
                * </pre>
                * @see setElemClickHandler
                */
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
                * @cfg {String|null} Устанавливает режим подгрузки данных по скроллу.
                * @remark
                * По умолчанию, подгрузка осуществляется "вниз". Мы поскроллили и записи подгрузились вниз.
                * Но можно настроить скролл так, что записи будут загружаться по скроллу к верхней границе контейнера.
                * Важно. Запросы к БЛ все так же будут уходить с увеличением номера страницы. V
                * Может использоваться для загрузки истории сообщений, например.
                * @variant down Подгружать данные при достижении дна контейнера (подгрузка "вниз").
                * @variant up Подгружать данные при достижении верха контейнера (подгрузка "вверх").
                * @variant null Не загружать данные по скроллу.
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
                * @cfg {jQuery | String} Контейнер в котором будет скролл, если представление данных ограничено по высоте.
                * Можно передать Jquery-селектор, но поиск будет произведен от контейнера вверх.
                * @see isInfiniteScroll
                * @see setInfiniteScroll
                */
               infiniteScrollContainer: undefined,
               /**
                * @cfg {Boolean} Устанавливает режим постраничной навигации.
                * @remark
                * Постраничная навигация списка может работать в двух состояниях:
                * <ol>
                *    <li>Полная. Пользователь видит номера первых страниц, затем многоточие и номер последней страницы.</li>
                *    <li>Частичная. Пользователь видит только номера текущей страницы, следующей и предыдущей. Общее количество страниц неизвестно.</li>
                * </ol>
                * Состояние постраничной навигации устанавливается по параметру n из dataSource (набора данных). Параметр по умолчанию поддерживается декларативным методом бизнес-логики.
                * Если для получения набора данных используется другой списочный метод, то разработчик должен самостоятельно устанавливать параметр n: если Boolean, то значит частичная постраничная навигация.
                * <br/>
                * Для контролов {@link SBIS3.CONTROLS.CompositeView} и {@link SBIS3.CONTROLS.TreeCompositeView} режим постраничной навигации имеет свои особенности работы:
                * <ol>
                *    <li>В режимах отображения "Список" и "Таблица" постраничная навигация не работает, даже если опция showPaging установлена в значение true. В этих режимах отображения автоматически устанавливается режим бесконечной подгрузки по скроллу - {@link infiniteScroll}.</li>
                *    <li>В режиме отображения "Плитка" постраничная навигация будет работать корректно.</li>
                * </ol>
                * Режим отображения устанавливают с помощью опции {@link SBIS3.CONTROLS.CompositeViewMixin#viewMode}.
                * @example
                * <pre>
                *     <option name="showPaging">true</option>
                * </pre>
                * @see setPage
                * @see getPage
                * @see infiniteScroll
                * @see SBIS3.CONTROLS.DSMixin#pageSize
                * @see SBIS3.CONTROLS.CompositeViewMixin#viewMode
                * @see SBIS3.CONTROLS.TreeCompositeView
                * @see SBIS3.CONTROLS.CompositeView
                */
               showPaging: false,
               /**
                * @cfg {String} Устанавливает режим редактирования по месту.<br>"" Редактирование по месту отключено.<br>click Режим редактирования по клику.<br>autoadd Режим автоматического добавления новых элементов коллекции; этот режим позволяет при завершении редактирования последнего элемента автоматически создавать новый.<br>toolbar Отображение панели инструментов при входе в режим редактирования записи.<br>single Режим редактирования единичной записи. После завершения редактирования текущей записи не происходит автоматического перехода к редактированию следующей записи.
                * @remark
                * Режимы редактирования можно группировать и получать совмещенное поведение.
                * Например, задать редактирование по клику и отобразить панель инструментов при входе в режим редактирования записи можно такой конфигурацией:
                * <pre>
                *    <option name="editMode">click|toolbar</option>
                * </pre>
                * Подробное описание каждого режима редактирования и их демонстрационные примеры вы можете найти в разделе документации {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/edit-in-place/ Редактирование по месту}.
                * @example
                * Установлен режим редактирования по клику на элемент коллекции.
                * <pre>
                *     <option name="editMode">click</option>
                * </pre>
                * @see getEditMode
                * @see setEditMode
                * @see editingTemplate
                */
               editMode: '',
               /**
                * @cfg {String} Устанавливает шаблон строки редактирования по месту.
                * Шаблон строки редактирования по месту используется для удобного представления редактируемой записи.
                * Такой шаблон отрисовывается поверх редактируемой строки с прозрачным фоном.
                * Это поведение считается нормальным в целях решения прикладных задач.
                * Чтобы отображать только шаблон строки без прозрачного фона, нужно установить для него свойство background-color.
                * Данная опция обладает большим приоритетом, чем установленный в колонках редактор (см. {@link SBIS3.CONTROLS.DataGridView#columns}).
                * Данная опция может быть переопределена с помощью метода (@see setEditingTemplate).
                * Переопределить опцию можно в любой момент до показа редакторов на строке, например: (@see onBeginEdit) или (@see onItemClick).
                * @example
                * Пример шаблона вы можете найти в разделе <a href="https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/edit-in-place/template/">Шаблон строки редактирования по месту</a>.
                * @see editMode
                * @see setEditingTemplate
                * @see getEditingTemplate
                */
               editingTemplate: undefined,
               /**
                * @cfg {String} Устанавливает позицию отображения строки итогов.
                * @variant none Строка итогов не будет отображаться.
                * @variant top Строка итогов будет расположена вверху.
                * @variant bottom Строка итогов будет расположена внизу.
                * @remark
                * Отображение строки итогов конфигурируется тремя опциями: resultsPosition, {@link resultsText} и {@link resultsTpl}.
                * Данная опция определяет расположение строки итогов, а также предоставляет возможность отображения строки в случае отсутствия записей.
                * С подробным описанием можно ознакомиться в статье {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/list-visual-display/results/ Строка итогов}.
                * @example
                * <pre class="brush: xml">
                *     <option name="resultsPosition">bottom</option> <!-- Строка итогов будет отображена под всеми элементами коллекции -->
                * </pre>
                * @see resultsText
                * @see resultsTpl
                */
               resultsPosition: 'none',
               /**
                * @cfg {String} Устанавливает заголовок строки итогов.
                * @remark
                * Отображение строки итогов конфигурируется тремя опциями: resultsText, {@link resultsPosition} и {@link resultsTpl}.
                * В данную опцию передается заголовок строки итогов.
                * С подробным описанием можно ознакомиться в статье {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/list-visual-display/results/ Строка итогов}.
                * @example
                * <pre class="brush: xml">
                *    <option name="resultsText">Перечислено за квартал: </option>
                * </pre>
                * @see resultsPosition
                * @see resultsTpl
                */
               resultsText : rk('Итого'),
               /**
                * @cfg {String} Устанавливает шаблон отображения строки итогов.
                * @remark
                * Отображение строки итогов конфигурируется тремя опциями: resultsTpl, {@link resultsPosition} и {@link resultsText}.
                * В данную опцию передается имя шаблона, в котором описана конфигурация строки итогов.
                * Чтобы шаблон можно было передать в опцию компонента, его нужно предварительно подключить в массив зависимостей.
                * Опция позволяет пользователю выводить в строку требуемые данные и задать для нее определенное стилевое оформление.
                * Подсчет каких-либо итоговых сумм в строке не предусмотрен. Все итоги рассчитываются на стороне источника данных.
                * С подробным описанием можно ознакомиться в статье {@link https://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/list-visual-display/results/ Строка итогов}.
                * @example
                * 1. Подключаем шаблон в массив зависимостей:
                * <pre>
                *     define('js!SBIS3.Demo.nDataGridView',
                *        [
                *           ...,
                *           'html!SBIS3.Demo.nDataGridView/resources/resultTemplate'
                *        ],
                *        ...
                *     );
                * </pre>
                * 2. Передаем шаблон в опцию:
                * <pre class="brush: xml">
                *     <option name="resultsTpl" value="html!SBIS3.Demo.nDataGridView/resources/resultTemplate"></option>
                * </pre>
                * @editor CloudFileChooser
                * @editorConfig extFilter xhtml
                * @see resultsPosition
                * @see resultsText
                */
               resultsTpl: undefined,
               /**
                * @cfg {Boolean} Использовать режим частичной навигации
                * Задаёт какой режим навигации использовать: полный или частичный.
                */
               partialPaging: true,
               scrollPaging: true //Paging для скролла. TODO: объеденить с обычным пэйджингом в 200
            },
            //Флаг обозначает необходимость компенсировать подгрузку по скроллу вверх, ее нельзя делать безусловно, так как при подгрузке вверх могут добавлятся элементы и вниз тоже
            _needSrollTopCompensation: false,
            _scrollWatcher : undefined,
            _lastDeleteActionState: undefined, //Используется для хранения состояния операции над записями "Delete" - при редактировании по месту мы её скрываем, а затем - восстанавливаем состояние
            _searchParamName: undefined, //todo Проверка на "searchParamName" - костыль. Убрать, когда будет адекватная перерисовка записей (до 150 версии, апрель 2016)
            _scrollOnBottom: true, // TODO: Придрот для скролла вниз при первой подгрузке. Если включена подгрузка вверх то изначально нужно проскроллить контейнер вниз,
            //но после загрузки могут долетать данные (картинки в docviewer например), которые будут скроллить вверх.
            _scrollOnBottomTimer: null, //TODO: см. строчкой выше
            _componentBinder: null,
            _touchSupport: false
         },

         $constructor: function () {
            var dispatcher = $ws.single.CommandDispatcher;

            this._publish('onChangeHoveredItem', 'onItemClick', 'onItemActivate', 'onDataMerge', 'onItemValueChanged', 'onBeginEdit', 'onAfterBeginEdit', 'onEndEdit', 'onBeginAdd', 'onAfterEndEdit', 'onPrepareFilterOnMove', 'onPageChange');
            this._container.on('swipe tap mousemove mouseleave', this._eventProxyHandler.bind(this));

            this.initEditInPlace();
            this.setItemsDragNDrop(this._options.itemsDragNDrop);
            dispatcher.declareCommand(this, 'activateItem', this._activateItem);
            dispatcher.declareCommand(this, 'beginAdd', this._beginAdd);
            dispatcher.declareCommand(this, 'beginEdit', this._beginEdit);
            dispatcher.declareCommand(this, 'cancelEdit', this._cancelEdit);
            dispatcher.declareCommand(this, 'commitEdit', this._commitEdit);
         },

         init: function () {
            if (typeof this._options.pageSize === 'string') {
               this._options.pageSize = this._options.pageSize * 1;
            }
            if (this._isSlowDrawing()) {
               this.setGroupBy(this._options.groupBy, false);
            }
            this._prepareInfiniteScroll();
            ListView.superclass.init.call(this);
            if (!this._options._serverRender) {
               if (this.getItems()) {
                  this.redraw()
               }
               else if (this._dataSource){
                  this.reload();
               }
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

         _setTouchSupport: function(support) {
            var currentTouch = this._touchSupport;
            this._touchSupport = Boolean(support);

            var container = this.getContainer(),
                toggleClass = container.toggleClass.bind(container, 'controls-ListView__touchMode', this._touchSupport);

            if(this._itemsToolbar) {
               /* При таче, можно поменять вид операций,
                  т.к. это не будет вызывать никаких визуальных дефектов,
                  а просто покажет операции в тач моде */
               if((!this._itemsToolbar.isVisible() || this._touchSupport) && this._itemsToolbar.getProperty('touchMode') !== this._touchSupport) {
                  toggleClass();
                  this._itemsToolbar.setTouchMode(this._touchSupport);
               }
            } else if(currentTouch !== this._touchSupport) {
               toggleClass();
            }
         },

         _eventProxyHandler: function(e) {
            var originalEvent = e.originalEvent;
            /* Надо проверять mousemove на срабатывание на touch устройствах,
               т.к. оно стреляет после тапа. После тапа событие mousemove имеет нулевой сдвиг, поэтому обрабатываем его как touch событие
                + добавляю проверку, что до этого мы были в touch режиме,
               это надо например для тестов, в которых эмулирется событие mousemove так же без сдвига, как и на touch устройствах. */
            this._setTouchSupport(Array.indexOf(['swipe', 'tap'], e.type) !== -1 || (e.type === 'mousemove' && !originalEvent.movementX && !originalEvent.movementY && this._touchSupport));

            switch (e.type) {
               case 'mousemove':
                  this._mouseMoveHandler(e);
                  break;
               case 'swipe':
                  this._swipeHandler(e);
                  break;
               case 'tap':
                  this._tapHandler(e);
                  break;
               case 'mouseleave':
                  this._mouseLeaveHandler(e);
                  break;
            }
         },

         _prepareInfiniteScroll: function(){
            var topParent = this.getTopParent(),
                  self = this,
                  scrollWatcherCfg = {};
            if (this.isInfiniteScroll()) {
               this._createLoadingIndicator();
               //для подгрузки вверх пока поставим 0 - иначе при постоянной прокрутке может сразу много данных
               //загрузиться - будет некрасиво доскроллено
               scrollWatcherCfg.checkOffset = START_NEXT_LOAD_OFFSET;
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
                  var afterFloatAreaShow = function(){
                     this._firstScrollTop = true;
                     if (this.getItems()) {
                        this._preScrollLoading();
                     }
                     topParent.unsubscribe('onAfterShow', afterFloatAreaShow);
                  }
                  //Делаем через subscribeTo, а не once, что бы нормально отписываться при destroy FloatArea
                  this.subscribeTo(topParent, 'onAfterShow', afterFloatAreaShow.bind(this));
               }

               this._scrollWatcher = new ScrollWatcher(scrollWatcherCfg);
               if (this._options.infiniteScrollContainer){
                  this._options.infiniteScrollContainer.on('touchmove wheel', function(){
                     self._scrollOnBottom = false;
                  });

               }
               if (this._options.infiniteScroll == 'down' && this._options.scrollPaging){
                  this._createScrollPager();
               }
               this._scrollWatcher.subscribe('onScroll', this._onScrollHandler.bind(this));
               this._scrollWatcher.subscribe('onScrollMove', this._onScrollMoveHandler.bind(this));
            }
         },
         _onScrollHandler: function(event, type){
            var scrollOnEdge = (this._options.infiniteScroll === 'up' && type === 'top') || // скролл вверх и доскролили до верхнего края
                               (this._options.infiniteScroll === 'down'); //скролл в обе стороны и доскролили до любого края
            if (scrollOnEdge) {
               this._scrollDirection = type;
               this._loadChecked(type == 'top' ? 'up' : 'down');
            }
         },
         _createScrollPager: function(){
            this._scrollPager = new Paging({
               element: $('.controls-ListView__scrollPager', this._container),
               visible: false,
               keyField: 'id',
               parent: this
            });
            if ($ws._const.browser.isMobilePlatform){
               $('.controls-ListView__scrollPager', this._container).appendTo(this._scrollWatcher.getScrollContainer());
            }
            this._setScrollPagerPosition();
            this._scrollBinder = new ComponentBinder({
               view: this,
               paging: this._scrollPager
            });
            this._scrollBinder.bindScrollPaging();
         },

         _onScrollMoveHandler: function(event, scrollTop){
            if (this._options.infiniteScroll == 'down' && this._options.scrollPaging){
               var scrollPage = this._scrollBinder._getScrollPage(scrollTop);
               this._notify('onScrollPageChange', scrollPage);
            }
         },
         _setScrollPagerPosition: function(){
            var right = $(window).width() - this.getContainer().get(0).getBoundingClientRect().right;
            this._scrollPager.getContainer().css('right', right);
         },
         _keyboardHover: function (e) {
            var
               selectedKeys,
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
                     this._elemClickHandler(selectedKey, this.getItems().getRecordById(selectedKey), selectedItem);
                  }
                  break;
               case $ws._const.key.space:
                  newSelectedItem = this._getNextItemByDOM(selectedKey);
                  if (!this._container.hasClass('controls-ListView__hideCheckBoxes')) {
                     this.toggleItemsSelection([selectedKey]);
                  }
                  break;
               case $ws._const.key.o:
                  if (e.ctrlKey && e.altKey && e.shiftKey) {
                     this.sendCommand('mergeItems', this.getSelectedKeys());
                  }
                  break;
               case $ws._const.key.del:
                   selectedKeys = this._options.multiselect ? this.getSelectedKeys() : [];
                   if (selectedKeys.length === 0 && selectedKey) {
                      selectedKeys = [selectedKey];
                   }
                   if (selectedKeys.length && this._allowDelete()) {
                      this.deleteRecords(selectedKeys);
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
         //TODO: Придрот для .150, чтобы хоткей del отрабатывал только если есть соответствующая операция над записью.
         _allowDelete: function() {
            var itemActions = this.getItemsActions();
            return this.isEnabled() && !!itemActions && !!itemActions.getItemInstance('delete');
         },
         /**
          * Возвращает следующий элемент
          * @param id
          * @returns {jQuery}
          */
         getNextItemById: function (id) {
            var projection = this._getItemsProjection();
            return this._getHtmlItemByProjectionItem(
                projection.getNext(
                    projection.getItemBySourceItem(
                     this.getItems().getRecordById(id)
                  )
               )
            );
         },
         /**
          * Возвращает предыдущий элемент
          * @param id
          * @returns {jQuery}
          */
         getPrevItemById: function (id) {
            var projection = this._getItemsProjection();
            return this._getHtmlItemByProjectionItem(
                projection.getPrevious(
                    projection.getItemBySourceItem(
                     this.getItems().getRecordById(id)
                  )
               )
            );
         },

         _getNextItemByDOM: function(id) {
            return this._getHtmlItemByDOM(id, true);
         },

         _getPrevItemByDOM: function(id) {
            return this._getHtmlItemByDOM(id, false);
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
               return this.getItems().getRecordByKey(siblingItem.data('id')) ? siblingItem : this._getHtmlItemByDOM(siblingItem.data('id'), isNext);
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
               id = this._getItemsProjection().getByHash(target.data('hash')).getContents().getId();
               this._elemClickHandler(id, this.getItems().getRecordByKey(id), e.target);
            }
            if (this._options.multiselect && $target.length && $target.hasClass('controls-DataGridView__th__checkBox')){
               $target.hasClass('controls-DataGridView__th__checkBox__checked') ? this.setSelectedKeys([]) :this.setSelectedItemsAll();
               $target.toggleClass('controls-DataGridView__th__checkBox__checked');
            }
            if (!Object.isEmpty(this._options.groupBy) && this._options.groupBy.clickHandler instanceof Function) {
               var closestGroup = $target.closest('.controls-GroupBy', this._getItemsContainer());
               if (closestGroup.length) {
                  this._options.groupBy.clickHandler.call(this, $target);
               }
            }
         },
         /**
          * Обрабатывает перемещения мышки на элемент представления
          * @param e
          * @private
          */
         _mouseMoveHandler: function (e) {
            var $target = $(e.target),
                target;

            target = this._findItemByElement($target);

            if (target.length) {
               /* Проверяем, чем был вызвано событие, мышью или движением пальца,
                  чтобы в зависимости от этого понимать, надо ли показывать операции */
               if(!this._touchSupport) {
                  this._changeHoveredItem(target);
               }
            } else if (!this._isHoverControl($target)) {
               this._mouseLeaveHandler();
            }
         },

         _getScrollContainer: function() {
            var scrollWatcher = this._scrollWatcher,
                scrollContainer;

            function findScrollContainer(node) {
               if (node === null) {
                  return null;
               }

               if (node.scrollHeight > node.clientHeight) {
                  return node;
               } else {
                  findScrollContainer(node.parentNode);
               }
            }

            if(scrollWatcher) {
               scrollContainer = scrollWatcher.getScrollableContainer();
            } else {
               /* т.к. скролл может находиться у произвольного контейнера, то попытаемся его найти */
               scrollContainer = $(findScrollContainer(this._container[0]));

               /* если всё же не удалось найти, то просто будем считать body */
               if(!scrollContainer.length) {
                  scrollContainer = $ws._const.$body;
               }
            }

            return scrollContainer;
         },

         /**
          * Метод, меняющий текущий выделеный по ховеру элемент
          * @param {jQuery} target Новый выделеный по ховеру элемент
          * когда ключ элемента не поменялся, но сам он изменился (перерисовался)
          * @private
          */
         _changeHoveredItem: function(target) {
            var targetKey = target[0].getAttribute('data-id');

            if (targetKey !== undefined && (this._hoveredItem.key !== targetKey)) {
               this._updateHoveredItem(target);
            }
         },

         _updateHoveredItem: function(target) {
            this._hasHoveredItem() && this.getHoveredItem().container.removeClass('controls-ListView__hoveredItem');
            target.addClass('controls-ListView__hoveredItem');
            this._hoveredItem = this._getElementData(target);
            this._notifyOnChangeHoveredItem();
         },

         _getDomElementByItem : function(item) {
            //FIXME т.к. строка редактирования по местру спозиционирована абсолютно, то надо искать оригинальную строку
            return this._getItemsContainer().find('.js-controls-ListView__item[data-hash="' + item.getHash() + '"]:not(.controls-editInPlace)')
         },

         _getElementData: function(target) {
            if (target.length){
               var cont = this._container[0],
                   containerCords = cont.getBoundingClientRect(),
                   targetKey = target[0].getAttribute('data-id'),
                   item = this.getItems() ? this.getItems().getRecordById(targetKey) : undefined,
                   correctTarget = target.hasClass('controls-editInPlace') ? this._getDomElementByItem(this._options._itemsProjection.getItemBySourceItem(item)) : target,
                   targetCords = correctTarget[0].getBoundingClientRect();

               return {
                  key: targetKey,
                  record: item,
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
               if (target.container){
                  if (!this._touchSupport) {
                     this._showItemsToolbar(target);
                  }
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
            this._getEmptyDataContainer().empty().html(html);
            this._toggleEmptyData(!!html);
         },

         _getEmptyDataContainer: function() {
            return $('.controls-ListView__EmptyData', this._container.get(0));
         },

         setMultiselect: function(flag) {
            ListView.superclass.setMultiselect.apply(this, arguments);
            this.getContainer().toggleClass('controls-ListView__multiselect', flag)
                               .toggleClass('controls-ListView__multiselect__off', !flag);
         },

         /**
          * Устанавливает шаблон отображения элемента коллекции.
          * @param {String|Function} tpl Шаблон отображения каждого элемента коллекции.
          * Подробнее о подключении в компонент шаблона вы можете прочитать в опции {@link itemTemplate}.
          * @example
          * <pre>
          *     DataGridView.setItemTemplate(myItemTpl);
          * </pre>
          * @see itemTemplate
          */
         setItemTemplate: function(tpl) {
            this._options.itemTemplate = tpl;
         },

         _getItemsContainer: function () {
            return $('.controls-ListView__itemsContainer', this._container.get(0)).first();
         },
         _getItemContainer: function(parent, item) {
            return parent.find('>[data-id="' + item.getId() + '"]:not(".controls-editInPlace")');
         },
         _addItemAttributes: function(container) {
            container.addClass('js-controls-ListView__item');
            ListView.superclass._addItemAttributes.apply(this, arguments);
         },

         /* +++++++++++++++++++++++++++ */

         _elemClickHandler: function (id, data, target) {
            var $target = $(target),
                self = this,
                elClickHandler = this._options.elemClickHandler,
                onItemClickResult;

            if (this._options.multiselect) {
               if ($target.hasClass('js-controls-ListView__itemCheckBox')) {
                  this._onCheckBoxClick($target);
               }
               else {
                  onItemClickResult = this._notifyOnItemClick(id, data, target);
               }
            }
            else {
               onItemClickResult = this._notifyOnItemClick(id, data, target);
            }
            if (onItemClickResult instanceof $ws.proto.Deferred) {
               onItemClickResult.addCallback(function (result) {
                  if (result !== false) {
                     self.setSelectedKey(id);
                     self._elemClickHandlerInternal(data, id, target);
                     elClickHandler && elClickHandler.call(self, id, data, target);
                  }
                  return result;
               });
            }
            else if (onItemClickResult !== false) {
               this.setSelectedKey(id);
               self._elemClickHandlerInternal(data, id, target);
               elClickHandler && elClickHandler.call(self, id, data, target);
            }
         },
         _notifyOnItemClick: function(id, data, target) {
            return this._notify('onItemClick', id, data, target);
         },
         _onCheckBoxClick: function(target) {
            this.toggleItemsSelection([target.closest('.controls-ListView__item').attr('data-id')]);
         },

         _elemClickHandlerInternal: function (data, id, target) {
            /* Клик по чекбоксу не должен вызывать активацию элемента */
            if(!$(target).hasClass('js-controls-ListView__itemCheckBox')) {
               this._activateItem(id);
            }
         },
         //TODO: Временное решение для выделения "всех" (на самом деле первой тысячи) записей
         setSelectedAll: function() {
            var selectedItems = this.getSelectedItems();
            if (this._options.infiniteScroll && this.getItems().getCount() < 1000){
               this.reload(this.getFilter(), this.getSorting(), 0, 1000)
                  .addCallback(function(dataSet) {
                     //Очистим selectedItems чтобы при заполнении новыми элементами, не делать проверку на наличие элементов в коллекции
                     if (selectedItems && selectedItems.getCount()) {
                        selectedItems.clear();
                     }
                     ListView.superclass.setSelectedItemsAll.call(this);
                     if (dataSet.getCount() == 1000 && dataSet.getMetaData().more){
                        InformationPopupManager.showMessageDialog({
                           status: 'default',
                           message: 'Отмечено 1000 записей, максимально допустимое количество, обрабатываемое системой СБИС.'
                        });
                     }
                  }.bind(this));
            } else {
               ListView.superclass.setSelectedItemsAll.call(this);
            }
         },
         _drawSelectedItems: function (idArray) {
            $(".controls-ListView__item", this._container).removeClass('controls-ListView__item__multiSelected');
            for (var i = 0; i < idArray.length; i++) {
               $('.controls-ListView__item[data-id="' + idArray[i] + '"]', this._container).addClass('controls-ListView__item__multiSelected');
            }
         },

         /*TODO третий аргумент - временное решение, пока выделенность не будет идти через состояние
         * делаем его, чтоб не после каждого чмха перерисовывать выделение
         * */
         _drawSelectedItem: function (id, index, lightVer) {
            //рисуем от ключа
            var selId = id;
            if (!lightVer) {
               $(".controls-ListView__item", this._getItemsContainer()).removeClass('controls-ListView__item__selected');
               $('.controls-ListView__item[data-id="' + selId + '"]', this._container).addClass('controls-ListView__item__selected');
            }
         },
         /**
          * Перезагружает набор записей представления данных с последующим обновлением отображения.
          * @remark
          * Производится запрос на выборку записей из источника данных по установленным параметрам:
          * <ol>
          *    <li>Параметры фильтрации, которые устанавливают с помощью опции {@link SBIS3.CONTROLS.ItemsControlMixin#filter}.</li>
          *    <li>Параметры сортировки, которые устанавливают с помощью опции {@link SBIS3.CONTROLS.ItemsControlMixin#sorting}.</li>
          *    <li>Порядковый номер записи в источнике, с которого будет производиться отбор записей для выборки. Устанавливают с помощью метода {@link SBIS3.CONTROLS.ItemsControlMixin#setOffset}.</li>
          *    <li>Масимальное число записей, которые будут присутствовать в выборке. Устанавливают с помощью метода {@link SBIS3.CONTROLS.ItemsControlMixin#pageSize}.</li>
          * </ol>
          * Вызов метода инициирует событие {@link SBIS3.CONTROLS.ItemsControlMixin#onBeforeDataLoad}. В случае успешной перезагрузки набора записей происходит событие {@link SBIS3.CONTROLS.ItemsControlMixin#onDataLoad}, а в случае ошибки - {@link SBIS3.CONTROLS.ItemsControlMixin#onDataLoadError}.
          * Если источник данных не установлен, производит перерисовку установленного набора данных.
          * @return {$ws.proto.Deferred}
          * @example
          * <pre>
          *    btn.subscribe('onActivated', function() {
          *       DataGridViewBL.reload();
          *    });
          * </pre>
          */
         reload: function () {
            this._reloadInfiniteScrollParams();
            this._previousGroupBy = undefined;
            this._firstScrollTop = true;
            this._unlockItemsToolbar();
            this._hideItemsToolbar();
            return ListView.superclass.reload.apply(this, arguments);
         },

         setFilter: function(filter, noLoad){
            if (!noLoad) {
               this._resetScrollMark();
            }
            ListView.superclass.setFilter.apply(this, arguments);
         },

         _resetScrollMark: function(){
            if (this._options.infiniteScroll == 'up'){
               this._scrollOnBottom = true;
            }
         },

         _reloadInfiniteScrollParams : function(){
            if (this.isInfiniteScroll()) {
               this._scrollOffset.top = this._offset;
               this._scrollOffset.bottom = this._offset;
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
            return !$ws._const.compatibility.touch && this._options.editMode.indexOf('hover') !== -1;
         },
         _isClickEditMode: function() {
            return this._options.editMode.indexOf('click') !== -1 || ($ws._const.compatibility.touch && this._options.editMode.indexOf('hover') !== -1);
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
                  return this._getEditInPlace().endEdit(true).addCallback(function() {
                     return handler.apply(this, args)
                  }.bind(this));
               } else {
                  return handler.apply(this, args)
               }
            }
         },
         /**
          * Устанавливает режим редактирования по месту.
          * @param {String} editMode Режим редактирования по месту. Подробнее о возможных значениях вы можете прочитать в описании к опции {@link editMode}.
          * @see editMode
          * @see getEditMode
          */
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
         /**
          * Возвращает признак, по которому можно определить установленный режим редактирования по месту.
          * @returns {String} Режим редактирования по месту. Подробнее о возможных значениях вы можете прочитать в описании к опции {@link editMode}.
          * @see editMode
          * @see setEditMode
          */
         getEditMode: function() {
            return this._options.editMode;
         },
         /**
          * Устанавливает шаблон строки редактирования по месту.
          * @param {String} template Шаблон редактирования по месту. Подробнее вы можете прочитать в описании к опции {@link editingTemplate}.
          * @see editingTemplate
          * @see getEditingTemplate
          */
         setEditingTemplate: function(template) {
            this._options.editingTemplate = template;
            if (this._hasEditInPlace()) {
               this._getEditInPlace().setEditingTemplate(template);
            }
         },

         /**
          * Возвращает шаблон редактирования по месту.
          * @returns {String} Шаблон редактирования по месту. Подробнее вы можете прочитать в описании к опции {@link editingTemplate}.
          * @see editingTemplate
          * @see setEditingTemplate
          */
         getEditingTemplate: function() {
            return this._options.editingTemplate;
         },

         showEip: function(target, model, options) {
            return this._canShowEip() ? this._getEditInPlace().showEip(target, model, options) : $ws.proto.Deferred.fail();
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
            event.setResult(this.showEip($(target).closest('.js-controls-ListView__item'), record, { isEdit: true }));
         },

         _onChangeHoveredItemHandler: function(event, hoveredItem) {
            var target = hoveredItem.container;
            if (target && !(target.hasClass('controls-editInPlace') || target.hasClass('controls-editInPlace__editing'))) {
               this.showEip(target, this.getItems().getRecordById(hoveredItem.key), { isEdit: false });
               // todo Удалить при отказе от режима "hover" у редактирования по месту [Image_2016-06-23_17-54-50_0108] https://inside.tensor.ru/opendoc.html?guid=5bcdb10f-9d69-49a0-9807-75925b726072&description=
            } else if (this._hasEditInPlace()) {
               this._getEditInPlace().hide();
            }
         },

         redrawItem: function(item) {
            ListView.superclass.redrawItem.apply(this, arguments);
            if (this._editingItem.model && this._editingItem.model.getId() === item.getId()) {
               this._editingItem.target = this._getElementByModel(item);
            }
            //TODO: Временное решение для .100.  В .30 состояния выбранности элемента должны добавляться в шаблоне.
            this._drawSelectedItems(this.getSelectedKeys());
            this._drawSelectedItem(this.getSelectedKey());
         },
         redraw: function () {
            /*TODO Косяк с миксинами - не вызывается before из decorableMixin временное решение*/
            if (this._options._decorators) {
               this._options._decorators.update(this);
            }
            this._destroyEditInPlace();
            ListView.superclass.redraw.apply(this, arguments);
         },

         /**
          * Проверить наличие скрола, и догрузить еще данные если его нет
          * @return {[type]} [description]
          */
         scrollLoadMore: function(){
            if (this._options.infiniteScroll && this._scrollWatcher && !this._scrollWatcher.hasScroll(this.getContainer())) {
               this._loadNextPage();
            }
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

         //TODO: Сейчас ListView не является родителем редактирования по месту, и при попытке отвалидировать
         //ListView, валидация редактирования не вызывается. Сейчас есть сценарий, когда редактирование
         //располагается на карточке, и при попытке провалидировать карточку перед сохранением, результат
         //будет true, но редактирование может быть невалидно.
         validate: function() {
            var editingIsValid = !(this.isEdit() && !this._getEditInPlace().validate());
            return ListView.superclass.validate.apply(this, arguments) && editingIsValid;
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
                  dataSet: this.getItems(),
                  editingItem: this._editingItem,
                  ignoreFirstColumn: this._options.multiselect,
                  dataSource: this._dataSource,
                  itemsProjection: this._getItemsProjection(),
                  notEndEditClassName: this._notEndEditClassName,
                  editingTemplate: this._options.editingTemplate,
                  itemsContainer: this._getItemsContainer(),
                  element: $('<div>'),
                  opener: this,
                  endEditByFocusOut: this._options.editMode.indexOf('toolbar') === -1,
                  modeAutoAdd: this._options.editMode.indexOf('autoadd') !== -1,
                  modeSingleEdit: this._options.editMode.indexOf('single') !== -1,
                  handlers: {
                     onItemValueChanged: function(event, difference, model) {
                        event.setResult(this._notify('onItemValueChanged', difference, model));
                     }.bind(this),
                     onBeginEdit: function(event, model) {
                        event.setResult(this._notify('onBeginEdit', model));
                     }.bind(this),
                     onAfterBeginEdit: function(event, model) {
                        var itemsInstances;
                        if (this._options.editMode.indexOf('toolbar') !== -1) {
                           this._getItemsToolbar().unlockToolbar();
                           //Отображаем кнопки редактирования
                           this._getItemsToolbar().showEditActions();
                           if (model.getState() === Record.RecordState.DETACHED) {
                              if (this.getItemsActions()) {
                                 itemsInstances = this.getItemsActions().getItemsInstances();
                                 if (itemsInstances['delete']) {
                                    this._lastDeleteActionState = itemsInstances['delete'].isVisible();
                                    itemsInstances['delete'].hide();
                                 }
                              }
                           }
                           //Отображаем itemsToolbar для редактируемого элемента и фиксируем его
                           this._showItemsToolbar(this._getElementData(this._editingItem.target));
                           this._getItemsToolbar().lockToolbar();
                        }
                        if (model.getState() === Record.RecordState.DETACHED) {
                           $(".controls-ListView__item", this._getItemsContainer()).removeClass('controls-ListView__item__selected');
                           $('.controls-ListView__item[data-id="' + model.getId() + '"]', this._container).addClass('controls-ListView__item__selected');
                        }
                        else {
                           this.setSelectedKey(model.getId());
                        }
                        event.setResult(this._notify('onAfterBeginEdit', model));
                     }.bind(this),
                     onChangeHeight: function() {
                        if (this._getItemsToolbar().isToolbarLocking()) {
                           this._showItemsToolbar(this._getElementData(this._editingItem.target));
                        }
                     }.bind(this),
                     onBeginAdd: function(event, options) {
                        event.setResult(this._notify('onBeginAdd', options));
                     }.bind(this),
                     onEndEdit: function(event, model, withSaving) {
                        event.setResult(this._notify('onEndEdit', model, withSaving));
                     }.bind(this),
                     onAfterEndEdit: function(event, model, target, withSaving) {
                        this.setSelectedKey(model.getId());
                        event.setResult(this._notify('onAfterEndEdit', model, target, withSaving));
                        if (this._options.editMode.indexOf('toolbar') !== -1) {
                           //Скрываем кнопки редактирования
                           this._getItemsToolbar().unlockToolbar();
                           this._getItemsToolbar().hideEditActions();
                           if (this._lastDeleteActionState !== undefined) {
                              this.getItemsActions().getItemsInstances()['delete'].toggle(this._lastDeleteActionState);
                              this._lastDeleteActionState = undefined;
                           }
                           // Если после редактирования более hoveredItem остался - то нотифицируем об его изменении, в остальных случаях просто скрываем тулбар
                           if (this.getHoveredItem().container) {
                              this._notifyOnChangeHoveredItem();
                           } else {
                              this._hideItemsToolbar();
                           }
                        }
                     }.bind(this)
                  }
               };
            return config;
         },

         _getElementByModel: function(item) {
            // Даже не думать удалять ":not(...)". Это связано с тем, что при редактировании по месту может возникнуть задача перерисовать строку
            // DataGridView. В виду одинакового атрибута "data-id", это единственный способ отличить строку DataGridView от строки EditInPlace.
            return this._getItemsContainer().find('.js-controls-ListView__item[data-id="' + item.getId() + '"]:not(".controls-editInPlace")');
         },
         /**
          * Возвращает признак, по которому можно установить: активно или нет редактирование по месту в данный момент.
          * @returns {Boolean} Значение true нужно интерпретировать как "Редактирование по месту активно".
          */
         isEdit: function() {
            return this._hasEditInPlace() && this._getEditInPlace().isEdit();
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
            var target = this._findItemByElement($(e.target));

            if(!target.length) {
               return;
            }

            if (e.direction == 'left') {
               this._changeHoveredItem(target);
               this._onLeftSwipeHandler();
            } else {
               this._onRightSwipeHandler();
               if(this._hasHoveredItem()) {
                  this._clearHoveredItem();
                  this._notifyOnChangeHoveredItem();
               }
            }
            e.stopPropagation();
         },

         _onLeftSwipeHandler: function() {
            if (this._isSupportedItemsToolbar()) {
               if (this._hasHoveredItem()) {
                  this._showItemsToolbar(this._hoveredItem);
                  this.setSelectedKey(this._hoveredItem.key);
               } else {
                  this._hideItemsToolbar();
               }
            }
         },

         /**
          * Возвращает, есть ли сейчас выделенный элемент в представлении
          * @returns {boolean}
          * @private
          */
         _hasHoveredItem: function () {
            return !!this._hoveredItem.container;
         },

         _onRightSwipeHandler: function() {
            if (this._isSupportedItemsToolbar()) {
               this._hideItemsToolbar(true);
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

            var elem = target.closest('.js-controls-ListView__item', this._getItemsContainer()),
                domElem = elem[0],
                dataId, dataHash;

            if(domElem) {
               dataId = domElem.getAttribute('data-id');
               dataHash = domElem.getAttribute('data-hash');
            } else {
               return elem;
            }

            if(this._getItemsProjection() && this._getItemProjectionByItemId(dataId) && this._getItemProjectionByHash(dataHash)) {
               return elem;
            } else {
               return this._findItemByElement(elem.parent());
            }
         },
         /**
          * Показывает оперцаии над записью для элемента
          * @private
          */
         _showItemsToolbar: function(target) {
            this._getItemsToolbar().show(target, this._touchSupport);
         },
         _unlockItemsToolbar: function() {
            if (this._itemsToolbar) {
               this._itemsToolbar.unlockToolbar();
            }
         },
         _hideItemsToolbar: function (animate) {
            if (this._itemsToolbar) {
               this._itemsToolbar.hide(animate);
            }
         },
         _getItemsToolbar: function() {
            var self = this;

            if (!this._itemsToolbar) {
               this._setTouchSupport(this._touchSupport);
               this._itemsToolbar = new ItemsToolbar({
                  element: this.getContainer().find('> .controls-ListView__ItemsToolbar-container'),
                  parent: this,
                  visible: false,
                  touchMode: this._touchSupport,
                  className: this._notEndEditClassName,
                  itemsActions: this._options.itemsActions,
                  showEditActions: this._options.editMode.indexOf('toolbar') !== -1,
                  handlers: {
                     onShowItemActionsMenu: function() {
                        var hoveredKey = self.getHoveredItem().key;

                        /* По стандарту, при открытии меню операций над записью,
                           строка у которой находятся оперции должна стать активной */
                        if(hoveredKey) {
                           self.setSelectedKey(hoveredKey);
                        }
                     },
                     onItemActionActivated: function(e, key) {
                        self.setSelectedKey(key);
                        if(self._touchSupport) {
                           self._clearHoveredItem();
                        }
                     }

                  }
               });
            }
            return this._itemsToolbar;
         },
         /**
          * Возвращает массив, описывающий установленный набор операций над записью, доступных по наведению курсора.
          * @returns {ItemsActions[]}
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
          * Устанавливает набор операций над записью, доступных по наведению курсора.
          * @param {ItemsActions[]} itemsActions
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
            if(this._itemsToolbar) {
               this._itemsToolbar.setItemsActions(this._options.itemsActions);
               if (this.getHoveredItem().container) {
                  this._notifyOnChangeHoveredItem()
               }
            }
         },
         /**
          * todo Проверка на "searchParamName" - костыль. Убрать, когда будет адекватная перерисовка записей (до 150 версии, апрель 2016)
          * @returns {boolean}
          * @private
          */
         _isSearchMode: function() {
            return this._searchParamName && !Object.isEmpty(this._options.groupBy) && this._options.groupBy.field === this._searchParamName;
         },
         _onCollectionAddMoveRemove: function(event, action, newItems, newItemsIndex, oldItems) {
            if (action === IBindCollection.ACTION_MOVE && this._isSearchMode()) {
               this.redraw();
            } else {
               ListView.superclass._onCollectionAddMoveRemove.apply(this, arguments);
            }
         },
         //**********************************//
         //КОНЕЦ БЛОКА ОПЕРАЦИЙ НАД ЗАПИСЬЮ //
         //*********************************//
         _drawItemsCallback: function () {
            var hoveredItem,
                hoveredItemContainer,
                hash,
                projItem,
                containsHoveredItem;

            ListView.superclass._drawItemsCallback.apply(this, arguments);
            if (this.isInfiniteScroll()) {
               this._preScrollLoading();
            }
            this._drawSelectedItems(this._options.selectedKeys);

            hoveredItem = this.getHoveredItem();
            hoveredItemContainer = hoveredItem.container;

             /* Если после перерисовки выделенный элемент удалился из DOM дерава,
               то событие mouseLeave не сработает, поэтому вызовем руками метод,
               если же он остался, то обновим положение кнопки опций*/
            if(hoveredItemContainer){
               // FIXME УДАЛИТЬ, вызывается, чтобы проходили тесты, просто создаёт индекс по хэшу в енумераторе
               this._getItemsProjection().getByHash(null);
               containsHoveredItem = $ws.helpers.contains(this._getItemsContainer()[0], hoveredItemContainer[0]);

               if(!containsHoveredItem && hoveredItemContainer) {
                  /*TODO сейчас зачем то в ховеред итем хранится ссылка на DOM элемент
                   * но этот элемент может теряться в ходе перерисовок. Выписана задача по которой мы будем
                   * хранить только идентификатор и данный код станет не нужен*/
                  hash = hoveredItemContainer.attr('data-hash');
                  projItem = this._getItemsProjection().getByHash(hash);
                  /* Если в проекции нет элемента и этого элемента нет в DOM'e,
                     но на него осталась jQuery ссылка, то надо её затереть */
                  if (projItem) {
                     hoveredItemContainer = this._getDomElementByItem(projItem);
                  } else {
                     hoveredItemContainer = null;
                  }
               }

               if(!containsHoveredItem) {
                  if(!hoveredItemContainer) {
                     this._mouseLeaveHandler();
                  } else {
                     this._updateHoveredItem(hoveredItemContainer);
                  }
               } else {
                  this._updateItemsToolbar();
               }
            }

            if (this._scrollBinder){
               this._scrollBinder._updateScrollPages(true);
            }

            this._notifyOnSizeChanged(true);
            this._drawResults();
            this._needToRedraw = true;
         },
         // TODO: скроллим вниз при первой загрузке, если пользователь никуда не скролил
         _onResizeHandler: function(){
            var self = this;
            if (this.getItems()){
               if (this._options.infiniteScroll == 'up' && this._scrollOnBottom){
                  self._scrollWatcher && self._scrollWatcher.scrollTo('bottom');
               }
               //Мог поменяться размер окна или смениться ориентация на планшете - тогда могут влезть еще записи, надо попробовать догрузить
               if (this._scrollWatcher && !this._scrollWatcher.hasScroll(this.getContainer())){
                  this._loadNextPage();
               }
               if (this._scrollPager){
                  //TODO: Это возможно очень долго, надо как то убрать. Нужно для случев, когда ListView создается скрытым, а потом показывается
                  this._scrollBinder && this._scrollBinder._updateScrollPages();
                  this._setScrollPagerPosition();
               }
            }
         },
         _removeItem: function(item){
            ListView.superclass._removeItem.call(this, item);
            if (this.isInfiniteScroll()) {
               this._preScrollLoading();
            }
         },
         //-----------------------------------infiniteScroll------------------------
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
            return this._allowInfiniteScroll && !!this._options.infiniteScroll;
         },
         /**
          *  Общая проверка и загрузка данных для всех событий по скроллу
          */
         _loadChecked: function (direction) {
            //Важно, чтобы датасет уже был готов к моменту, когда мы попытаемся грузить данные
            if (this.getItems()) {
               this._loadNextPage(direction);
            }
         },
         _cancelLoading: function(){
            ListView.superclass._cancelLoading.apply(this, arguments);
            if (this.isInfiniteScroll()){
               this._hideLoadingIndicator();
            }
         },

         /**
          * Подгрузить еще данные вверх или вниз
          * @param  {String} direction в какую сторону грузим
          */
         _loadNextPage: function (direction) {
            direction = direction || this._options.infiniteScroll;
            var loadAllowed  = this.isInfiniteScroll(),
               more = this.getItems().getMetaData().more,
               isContainerVisible = $ws.helpers.isElementVisible(this.getContainer()),
               hasScroll = this._scrollWatcher.hasScroll(this.getContainer()),
               hasNextPage = (direction == 'up' && this._options.infiniteScroll == 'down') ? this._scrollOffset.top > 0 : this._hasNextPage(more, this._scrollOffset.bottom),
               offset = (direction == 'up' && this._options.infiniteScroll == 'down') ? this._scrollOffset.top - this._limit : this._scrollOffset.bottom + this._limit;

            //Если подгружаем элементы до появления скролла показываем loading-indicator рядом со списком, а не поверх него
            this._container.toggleClass('controls-ListView__outside-scroll-loader', !hasScroll);

            //Если в догруженных данных в датасете пришел n = false, то больше не грузим.
            if (loadAllowed && isContainerVisible && hasNextPage && !this.isLoading()) {

               this._showLoadingIndicator();
               this._toggleEmptyData(false);
               this._notify('onBeforeDataLoad', this.getFilter(), this.getSorting(), offset, this._limit);
               this._loader = this._callQuery(this.getFilter(), this.getSorting(), offset, this._limit).addCallback($ws.helpers.forAliveOnly(function (dataSet) {
                  //ВНИМАНИЕ! Здесь стрелять onDataLoad нельзя! Либо нужно определить событие, которое будет
                  //стрелять только в reload, ибо между полной перезагрузкой и догрузкой данных есть разница!
                  this._loader = null;
                  //нам до отрисовки для пейджинга уже нужно знать, остались еще записи или нет
                  var hasNextPage = this._hasNextPage(dataSet.getMetaData().more, this._scrollOffset.bottom);
                  //Нужно прокинуть наружу, иначе непонятно когда перестать подгружать
                  this.getItems().setMetaData(dataSet.getMetaData());
                  this._hideLoadingIndicator();
                  if (!hasNextPage) {
                     this._toggleEmptyData(!this.getItems().getCount());
                  }
                  this._notify('onDataMerge', dataSet);
                  //Если данные пришли, нарисуем
                  if (dataSet.getCount()) {
                     //TODO: вскрылась проблема  проекциями, когда нужно рисовать какие-то определенные элементы и записи
                     //Возвращаем самостоятельную отрисовку данных, пришедших в загрузке по скроллу
                     if (this._isSlowDrawing()) {
                        this._needToRedraw = false;
                     }
                     this._drawPage(dataSet, direction);
                     //И выключаем после отрисовки
                     if (this._isSlowDrawing()) {
                        this._needToRedraw = true;
                     }
                  } else {
                     // Если пришла пустая страница, но есть еще данные - догрузим их
                     if (hasNextPage){
                        this._loadNextPage();
                     }
                  }
                  this._updateScrolOffset(this._options.infiniteScroll);

               }, this)).addErrback(function (error) {
                  //Здесь при .cancel приходит ошибка вида DeferredCanceledError
                  return error;
               });
            }
         },

         _drawPage: function(dataSet, direction){
            var at = null;
            //добавляем данные в начало или в конец в зависимости от того мы скроллим вверх или вниз
            if (direction === 'down') {
               //TODO новый миксин не задействует декоратор лесенки в принципе при любых действиях, кроме первичной отрисовки
               //это неправильно, т.к. лесенка умеет рисовать и дорисовывать данные, если они добавляются последовательно
               //здесь мы говорим, чтобы лесенка отработала при отрисовке данных
               var ladder = this._options._decorators.getByName('ladder');
               if (ladder){
                  ladder.setIgnoreEnabled(true);
               }
               //Achtung! Добавляем именно dataSet, чтобы не проверялся формат каждой записи - это экономит кучу времени
               this.getItems().append(dataSet);
               ladder && ladder.setIgnoreEnabled(false);
            } else {
               this._containerScrollHeight = this._scrollWatcher.getScrollHeight();
               this._needSrollTopCompensation = true;
               var items = dataSet.toArray();
               this.getItems().prepend(items);
               at = {at: 0};
            }

            if (this._isSlowDrawing()) {
               this._drawItems(dataSet.toArray(), at);
            }
            //TODO Пытались оставить для совместимости со старыми данными, но вызывает onCollectionItemChange!!!
            this._dataLoadedCallback();
            this._toggleEmptyData();
         },

         _updateScrolOffset: function(direction){
            if (direction === 'down') {
               this._scrollOffset.bottom += this._limit;
            } else {
               if (this._scrollOffset.top >= this._limit){
                  this._scrollOffset.top -= this._limit;
               } else {
                  this._scrollOffset.top = 0;
               }
               //FixMe: увеличиваем нижний оффсет для контактов - их скролл верх на самом деле скролл вниз + reverse
               if (this._options.infiniteScroll == 'up'){
                  this._scrollOffset.bottom += this._limit;
               }
            }
         },

         /**
          * Функция догрузки данных пока не появится скролл.Если появился и мы грузили и дорисовывали вверх, нужно поуправлять скроллом.
          * @private
          */
         _preScrollLoading: function(){
            var hasScroll = (function() {
                  return this._scrollWatcher && this._scrollWatcher.hasScroll(this.getContainer(), 10)
               }).bind(this);

            // Если нет скролла или скролл внизу, значит нужно догружать еще записи (floatArea отжирает скролл, поэтому если она открыта - не грузим)
            if (!this._existFloatArea() && ((this.isScrollOnBottom() && this._options.infiniteScroll == 'down') || !hasScroll())) {
               this._loadNextPage();
            } else {
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
            var scrollAmount,
               scrollingToTop =  this._scrollDirection !== 'down' && this._options.infiniteScroll == 'up';
            //сюда попадем только когда уже точно есть скролл
            if (this.isInfiniteScroll() && scrollingToTop && (this._needSrollTopCompensation || this._firstScrollTop)){
               scrollAmount = this._scrollWatcher.getScrollHeight() - this._containerScrollHeight;
               this._needSrollTopCompensation = false;
               //Если запускаем 1ый раз, то нужно поскроллить в самый низ (ведь там "начало" данных), в остальных догрузках скроллим вниз на
               //разницы величины скролла (т.е. на сколько добавилось высоты, на столько и опустили). Получается плавно
               //Так же цчитываем то, что индикатор появляется только на время загрузки и добавляет свою высоту
               this._scrollWatcher.scrollTo(this._firstScrollTop || (scrollAmount < 0) ? 'bottom' : scrollAmount);
            }
         },
         scrollToItem: function(item){
            if (item.getId && item.getId instanceof Function){
               this._scrollToItem(item.getId());
            }
         },
         _scrollToItem: function(itemId) {
            ListView.superclass._scrollToItem.call(this, itemId);
            var itemContainer = $('.controls-ListView__item[data-id="' + itemId + '"]', this._getItemsContainer());
            //TODO: будет работать только если есть infiniteScrollContainer, нужно сделать просто scrollContainer так как подгрузки может и не быть
            if (this._options.infiniteScrollContainer && this._options.infiniteScrollContainer.length && itemContainer.length){
               this._options.infiniteScrollContainer[0].scrollTop = itemContainer[0].offsetTop;
            }
         },
         isScrollOnBottom: function(){
            return this._scrollWatcher.isScrollOnBottom();
         },
         //Проверка есть ли открытые stack FloatArea или maximize Window, они могут збирать на себя скролл у body
         _existFloatArea: function(){
            var areas = $ws.single.FloatAreaManager._areas;
            var windows = $ws.single.WindowManager.getStack();
            for (var area in areas){
               if (areas.hasOwnProperty(area)){
                  if (areas[area].isVisible() && areas[area]._options.isStack){
                     return true;
                  }
               }
            }
            for (var i = 0; i < windows.length; i++){
               if (windows[i].window._options.maximize){
                  return true;
               }
            }
            return false;
         },
         isScrollOnTop: function(){
            if (this._options.infiniteScrollContainer && this._options.infiniteScrollContainer.length){
               return this._options.infiniteScrollContainer[0].scrollTop == 0;
            }
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
         setInfiniteScroll: function (type, noLoad) {
            if (typeof type === 'boolean'){
               this._allowInfiniteScroll = type;
            } else {
               this._options.infiniteScroll = type;
               this._allowInfiniteScroll = true;
            }
            if (type && !noLoad) {
               this._loadNextPage();
               return;
            }
            //НА саом деле если во время infiniteScroll произошла ошибка загрузки, я о ней не смогу узнать, но при выключении нужно убрать индикатор
            if (!type && this._loadingIndicator && this._loadingIndicator.is(':visible')){
               this._cancelLoading();
            }
            //Убираем текст Еще 10, если включили бесконечную подгрузку
            this.getContainer().find('.controls-TreePager-container').toggleClass('ws-hidden', !!type);
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
               //Если нет следующей страницы - скроем индикатор загрузки
               if (!this._hasNextPage(this.getItems().getMetaData().more, this._scrollOffset.bottom)) {
                  this._hideLoadingIndicator();
               }
            }
            ListView.superclass._dataLoadedCallback.apply(this, arguments);
         },
         _toggleIndicator: function(show){
            var self = this,
                container = this.getContainer(),
                ajaxLoader = container.find('.controls-AjaxLoader').eq(0),
                indicator, centerCord, scrollContainer;


            this._showedLoading = show;
            if (show) {
               setTimeout(function(){
                  if (!self.isDestroyed() && self._showedLoading) {
                     scrollContainer = self._getScrollContainer();
                     indicator = ajaxLoader.find('.controls-AjaxLoader__outer');
                     if(indicator.length && scrollContainer && container[0].scrollHeight > scrollContainer[0].offsetHeight) {
                        /* Ищем кординату, которая находится по середине отображаемой области грида */
                        centerCord =
                           (Math.max(scrollContainer[0].getBoundingClientRect().bottom, 0) - Math.max(container[0].getBoundingClientRect().top, 0))/2;
                        /* Располагаем индикатор, учитывая прокрутку */
                        indicator[0].style.top = centerCord + scrollContainer[0].scrollTop + 'px';
                     } else {
                        /* Если скрола нет, то сбросим кординату, чтобы индикатор сам расположился по середине */
                        indicator[0].style.top = '';
                     }
                     ajaxLoader.removeClass('ws-hidden');
                  }
               }, 750);
            }
            else {
               ajaxLoader.addClass('ws-hidden');
            }
         },
         _toggleEmptyData: function(show) {
            this._getEmptyDataContainer().toggleClass('ws-hidden', !show);
         },
         //------------------------Paging---------------------
         _processPaging: function() {
            this._processPagingStandart();
         },
         _processPagingStandart: function () {
            if (!this._pager) {
               var more = this.getItems().getMetaData().more,
                  hasNextPage = this._hasNextPage(more),
                  pagingOptions = {
                     recordsPerPage: this._options.pageSize || more,
                     currentPage: 1,
                     recordsCount: more,
                     pagesLeftRight: 1,
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
                        var more = self.getItems().getMetaData().more,
                            hasNextPage = self._hasNextPage(more, self._scrollOffset.bottom),
                            maxPage = self._pager.getPaging()._maxPage;
                        //Старый Paging при включенной частичной навигации по нажатию кнопки "Перейти к последней странице" возвращает pageNum = 0 (у него индексы страниц начинаются с 1)
                        //В новом Pager'e индексация страниц начинается с 0 и такое поведение здесь не подходит
                        //Так же в режиме частичной навигации нет возможности высчитать номер последней страницы, поэтому
                        //при переходе к последней странице делаем так, чтобы мы переключились на последнюю доступную страницу.
                        if (pageNum == 0 && self._pager._options.pagingOptions.onlyLeftSide){
                           pageNum = hasNextPage ? (maxPage + 1) : maxPage;
                        }

                        self._setPageSave(pageNum);
                        self.setPage(pageNum - 1);
                        self._pageChangeDeferred = deferred;
                     }
                  }
               });
            }
            this._updatePaging();
         },
         _getQueryForCall: function(filter, sorting, offset, limit){
            var query = new Query();
            query.where(filter)
               .offset(offset)
               .limit(limit)
               .orderBy(sorting)
               .meta({ hasMore: this._options.partialPaging});
            return query;
         },
         /**
          * Метод обработки интеграции с пейджингом
          */
         _updatePaging: function () {
            var more = this.getItems().getMetaData().more,
               nextPage = this._hasNextPage(more, this._scrollOffset.bottom),
               numSelected = 0;
            if (this._pager) {
               //TODO Сейчас берется не всегда актуальный pageNum, бывают случаи, что значение(при переключении по стрелкам)
               //равно значению до переключения страницы. пофиксить чтобы всегда было 1 поведение
               var pageNum = this._pager.getPaging().getPage();
               if (this._pageChangeDeferred) { // только когда меняли страницу
                  this._pageChangeDeferred.callback([this.getPage() + 1, nextPage, nextPage]);//смотреть в DataSet мб ?
                  this._pageChangeDeferred = undefined;
               }
               //Если на странице больше нет записей - то устанавливаем предыдущую (если это возможно)
               if (this.getItems().getCount() === 0 && pageNum > 1) {
                  this._pager.getPaging().setPage(1); //чтобы не перезагружать поставим 1ую. было : pageNum - 1
               }
               this._pager.getPaging().update(this.getPage(this.isInfiniteScroll() ? this._scrollOffset.bottom : this._offset) + 1, more, nextPage);
               this._pager.getContainer().toggleClass('ws-hidden', !this.getItems().getCount());
               if (this._options.multiselect) {
                  numSelected = this.getSelectedKeys().length;
               }
               this._pager.updateAmount(this.getItems().getCount(), nextPage, numSelected);
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
          */
         setPage: function (pageNumber, noLoad) {
            pageNumber = parseInt(pageNumber, 10);
            var offset = this._offset;
            if (this._isPageLoaded(pageNumber)){
               if (this._getItemsProjection()){
                  var itemIndex = pageNumber * this._options.pageSize - this._scrollOffset.top,
                     itemId = this._getItemsProjection().getItemBySourceIndex(itemIndex).getContents().getId(),
                     item = this.getItems().getRecordById(itemId);
                  this.scrollToItem(item);
               }
            } else {
               this._offset = this._options.pageSize * pageNumber;
               this._scrollOffset.top = this._offset;
               this._scrollOffset.bottom = this._offset;
               if (!noLoad && this._offset !== offset) {
                  this.reload();
               }
            }
            this._notify('onPageChange', pageNumber);
         },


         _isPageLoaded: function(pageNumber) {
            var offset = pageNumber * this._options.pageSize;
            return (offset <= this._scrollOffset.bottom && offset >= this._scrollOffset.top);
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
          * @see setPage
          * @param {Number} [offset] - если передать, то номер страницы рассчитается от него
          */
         getPage: function (offset) {
            var offset = offset || this._offset,
                more = this.getItems().getMetaData().more;
            //Если offset отрицательный, значит запросили последнюю страницу.
            return Math.ceil((offset < 0 ? more + offset : offset) / this._options.pageSize);
         },
         _updateOffset: function () {
            var more = this.getItems().getMetaData().more,
               nextPage = this._hasNextPage(more);
            if (this.getPage() === -1) {
               this._offset = more - this._options.pageSize;
            }
         },
         //------------------------GroupBy---------------------
         _oldGroupByDefaultMethod: function (record) {
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
          * Выбирает элемент коллекции по переданному идентификатору.
          * @remark
          * На выбранный элемент устанавливается маркер (оранжевая вертикальная черта) и изменяется фон.
          * При выполнении команды происходит события {@link onItemActivate} и {@link onSelectedItemChange}.
          * @param {Number} id Идентификатор элемента коллекции, который нужно выбрать.
          * @example
          * <pre>
          *    myListView.sendCommand('activateItem', myId);
          * </pre>
          * @private
          * @command activateItem
          * @see sendCommand
          * @see beginAdd
          * @see cancelEdit
          * @see commitEdit
          */
         _activateItem : function(id) {
            var item = this.getItems().getRecordByKey(id);
            this._notify('onItemActivate', {id: id, item: item});
         },
         /**
          * @typedef {Object} BeginEditOptions
          * @property {String} [parentId] Идентификатор узла, в котором будет происходить добавление.
          * @property {String} [addPosition = bottom] Расположение строки с добавлением по месту.
          * Опция может принимать значение 'top' или 'bottom'.
          * @property {WS.Data/Entity/Model|Object} [model] Модель элемента коллекции, значения полей которой будут использованы при создании нового элемента.
          * В упрощенном варианте можно передать объект, свойствами которого будут поля создаваемого элемента коллекции. Например, установим создание нового элемента с предопределенным значением поля 'Наименование':
          * <pre>
          * {
          *    'Наименование': 'Компания "Тензор"'
          * }
          * </pre>
          */
         /**
          * Добавляет новый элемента коллекции.
          * @remark
          * Команда применяется для создания нового элемента коллекции без использования диалога редактирования.
          * Схожим функционалом обладает автоматическое добавление по месту представлений данных (см. опцию {@link editMode}).
          * @param {BeginEditOptions} [options]
          * @example
          * Частный случай вызова команды для создания нового узла иерархии внутри другого узла:
          * <pre>
          * this.sendCommand('beginAdd', {parentId: 'parentBranchId'});
          * </pre>
          * Полный пример использования команды для создания новых элементов коллекции в иерархическом списке вы можете найти {@link http://wi.sbis.ru/doc/platform/developmentapl/interfacedev/components/list/list-settings/records-editing/edit-in-place/users/add-in-place-hierarchy/ здесь}.
          * @returns {*|$ws.proto.Deferred} В случае ошибки, вернёт Deferred с текстом ошибки.
          * @private
          * @command beginAdd
          * @see sendCommand
          * @see activateItem
          * @see beginEdit
          * @see cancelEdit
          * @see commitEdit
          */
         _beginAdd: function(options) {
            if (!options) {
               options = {};
            }
            options.target = this._getItemProjectionByItemId(options.parentId);
            return this.showEip(null, null, options);
         },
         /**
          * Запускает редактирование по месту.
          * @remark
          * Используется для активации редактирования по месту без клика пользователя по элементу коллекции.
          * При выполнении команды происходят события {@link onBeginEdit} и {@link onAfterBeginEdit}.
          * @param {WS.Data/Entity/Model} record Элемент коллекции, для которого требуется активировать редактирование по месту.
          * @example
          * <pre>
          *    myListView.sendCommand('beginEdit', record);
          * </pre>
          * @private
          * @command beginEdit
          * @see sendCommand
          * @see cancelEdit
          * @see commitEdit
          * @see beginAdd
          * @see activateItem
          */
         _beginEdit: function(record) {
            var target = this._getItemsContainer().find('.js-controls-ListView__item[data-id="' + record.getId() + '"]:first');
            return this.showEip(target, record, { isEdit: true });
         },
         /**
          * Завершает редактирование по месту без сохранения изменений.
          * @remark
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
          * @see beginAdd
          * @see activateItem
          */
         _cancelEdit: function() {
            return this._getEditInPlace().endEdit();
         },
         /**
          * Завершает редактирование по месту с сохранением изменений.
          * @remark
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
          * @see beginAdd
          * @see activateItem
          */
         _commitEdit: function() {
            return this._getEditInPlace().endEdit(true);
         },
         destroy: function () {
            this._destroyEditInPlace();
            if (this._scrollWatcher) {
               this._scrollWatcher.unsubscribe('onScroll', this._onScrollHandler);
               this._scrollWatcher.destroy();
               this._scrollWatcher = undefined;
            }
            if (this._pager) {
               this._pager.destroy();
               this._pager = undefined;
            }
            if (this._scrollBinder){
               this._scrollBinder.destroy();
               this._scrollBinder = null;
            }
            if (this._scrollPager){
               this._scrollPager.destroy();
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
            if (Array.indexOf(keys, key) == -1 && Array.indexOf(keys, String(key)) == -1) {
               keys.push(key);
            }
            return keys;
         },
         _canDragStart: function(e) {
            //TODO: При попытке выделить текст в поле ввода, вместо выделения начинается перемещения элемента.
            //Как временное решение добавлена проверка на SBIS3.CONTROLS.TextBoxBase.
            //Необходимо разобраться можно ли на уровне TextBoxBase или Control для события mousedown
            //сделать stopPropagation, тогда от данной проверки можно будет избавиться.
            return !this._isShifted &&
                   this._options.enabled &&
                   !$ws.helpers.instanceOfModule($(e.target).wsControl(), 'SBIS3.CONTROLS.TextBoxBase') &&
                   !$(e.target).closest('.controls-DragNDropMixin__notDraggable').length;
         },
         _onDragStart: function(e) {
            var
                id,
                target;
            if (this._canDragStart(e)) {
               target = this._findItemByElement($(e.target));
               //TODO: данный метод выполняется по селектору '.js-controls-ListView__item', но не всегда если запись есть в вёрстке
               //она есть в _items(например при добавлении или фейковый корень). Метод _findItemByElement в данном случае вернёт
               //пустой массив. В .150 править этот метод опасно, потому что он много где используется. В .200 переписать метод
               //_findItemByElement, без завязки на _items.
               if (target.length) {
                  id = target.data('id');
                  this.setCurrentElement(e, {
                     keys: this._getDragItems(id),
                     targetId: id,
                     target: target,
                     insertAfter: undefined
                  });
               }
               //TODO: Сейчас появилась проблема, что если к компьютеру подключен touch-телевизор он не вызывает
               //preventDefault и при таскании элементов мышкой происходит выделение текста.
               //Раньше тут была проверка !$ws._const.compatibility.touch и preventDefault не вызывался для touch устройств
               //данная проверка была добавлена, потому что когда в строке были отрендерены кнопки, при нажатии на них
               //и выполнении preventDefault впоследствии не вызывался click. Написал демку https://jsfiddle.net/9uwphct4/
               //с воспроизведением сценария, на iPad и Android click отрабатывает. Возможно причина была ещё в какой-то
               //ошибке. При возникновении ошибок на мобильных устройствах нужно будет добавить проверку !$ws._const.browser.isMobilePlatform.
               e.preventDefault();
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
         /**
          * Устанавливает позицию строки итогов
          * @param {String} position Позиция
          * <ul>
          *    <li>none - Строка итогов не будет отображаться</li>
          *    <li>top - Строка итогов будет расположена вверху</li>
          *    <li>bottom - Строка итогов будет расположена внизу</li>
          * </ul>
          * @example
          * <pre>
          *     DataGridView.setResultsPosition('none');
          *     DataGridView.reload();
          * </pre>
          * @see resultsPosition
          */
         setResultsPosition: function(position){
           this._options.resultsPosition = position;
         },
         _drawResults: function(){
            if (!this._checkResults()){
               this._removeDrawnResults();
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
               startScrollColumn: self._options.startScrollColumn,
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
            var position = this._addResultsMethod || (this._options.resultsPosition == 'top' ? 'prepend' : 'append');
            this._removeDrawnResults();
            $(container)[position](resultRow);
            this.reviveComponents();
         },
         _removeDrawnResults: function(){
            var resultRow = $('.controls-DataGridView__results', this.getContainer());
            if (resultRow.length){
               this._destroyControls(resultRow);
               resultRow.remove();
            }
         },
         /**
          * //todo коcтыль нужно разобраться почему долго работает
          * Инициализирует опцию selectedItems
          * @noShow
          */
         initializeSelectedItems: function() {
            if ($ws.helpers.instanceOfModule(this.getItems(), 'js!WS.Data/Collection/RecordSet')) {
               this._options.selectedItems = Di.resolve('collection.recordset', {
                  ownerShip: false,
                  adapter: this.getItems().getAdapter()
               });
            } else {
               ListView.superclass.initializeSelectedItems.call(this);
            }
         }
      });

      return ListView.mixin([BreakClickBySelectMixin]);
   });
