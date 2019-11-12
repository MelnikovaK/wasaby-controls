/**
 * Интерфейс для списков.
 *
 * @interface Controls/_list/interface/IList
 * @public
 * @author Авраменко А.С.
 */

/*
 * Interface for lists.
 *
 * @interface Controls/_list/interface/IList
 * @public
 * @author Авраменко А.С.
 */

/**
 * @name Controls/_list/interface/IList#contextMenuVisibility
 * @cfg {Boolean} Определяет доступность контекстного меню строки при нажатии на правую кнопку мыши.
 * <a href="/materials/demo-ws4-list-item-actions">Example</a>.
 * @default true
 */

/*
 * @name Controls/_list/interface/IList#contextMenuVisibility
 * @cfg {Boolean} Determines whether context menu should be shown on right-click.
 * <a href="/materials/demo-ws4-list-item-actions">Example</a>.
 * @default true
 */

/**
 * @name Controls/_list/interface/IList#contextMenuConfig
 * @cfg {Object} Устанавливает конфигурацию для меню операций над записью.
 * Набор опций передается объектом. Заданный объект мержится с минимальным объектом опций, отдаваемых в меню по-умолчанию.
 * В качестве ключей можно использовать следующие свойства:
 * - items - для смены набора элементов.
 * - groupingKeyCallback, groupingTemplate для установки группировки.
 * - itemTemplate - шаблон элемента меню.
 * - footerTemplate - шаблон футера.
 * - headerTemplate - шаблон шапки.
 */

/*ENG
 * @name Controls/_list/interface/IList#contextMenuConfig
 * @cfg {Object} Determines whether context menu should be shown on right-click.
 * <a href="/materials/demo-ws4-list-item-actions">Example</a>.
 * @default true
 */

/**
 * @name Controls/_list/interface/IList#emptyTemplate
 * @cfg {Function} Шаблон пустого списка (без элементов).
 * См.<a href="/materials/demo-ws4-list-base">демо-пример</a>
 * @remark
 * По умолчанию для emptyTemplate используется шаблон "Controls/list:EmptyTemplate".
 * Он рекомендован к использованию при описании собственного шаблона, отображаемого для пустого списка.
 * Шаблон "Controls/list:EmptyTemplate" принимает следующие параметры:
 * - contentTemplate — контент шаблона;
 * - topSpacing — расстояние между верхней границей и контентом шаблона;
 * - bottomSpacing — расстояние между нижней границей и контентом шаблона;
 * @example
 * <pre>
 *    <Controls.list:View>
 *       <ws:emptyTemplate>
 *          <ws:partial template="Controls/list:EmptyTemplate" topSpacing="xl" bottomSpacing="l">
 *             <ws:contentTemplate>Нет данных</ws:contentTemplate>
 *          </ws:partial>
 *       </ws:emptyTemplate>
 *    </Controls.list:View>
 * </pre>
 */

/*
 * @name Controls/_list/interface/IList#emptyTemplate
 * @cfg {Function} Template for the empty list.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 * @remark
 * We recommend to use default template for emptyTemplate: Controls/list:EmptyTemplate
 * The template accepts the following options:
 * - contentTemplate content of emptyTemplate
 * - topSpacing Spacing between top border and content of emptyTemplate
 * - bottomSpacing Spacing between bottom border and content of emptyTemplate
 * @example
 * <pre>
 *    <Controls.list:View>
 *       <ws:emptyTemplate>
 *          <ws:partial template="Controls/list:EmptyTemplate" topSpacing="xl" bottomSpacing="l">
 *             <ws:contentTemplate>Нет данных</ws:contentTemplate>
 *          </ws:partial>
 *       </ws:emptyTemplate>
 *    </Controls.list:View>
 * </pre>
 */

/**
 * @name Controls/_list/interface/IList#footerTemplate
 * @cfg {Function} Шаблон подвала списка.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 */

/*
 * @name Controls/_list/interface/IList#footerTemplate
 * @cfg {Function} Template that will be rendered below the list.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 */

/**
 * @name Controls/_list/interface/IList#multiSelectVisibility
 * @cfg {String} Режим отображения флагов множественного выбора.
 * <a href="/materials/demo-ws4-list-multiselect">См. демо-пример</a>.
 * @variant visible Показать.
 * @variant hidden Скрыть.
 * @variant onhover Показывать при наведении.
 * @default hidden
 * @remark
 * Чтобы включить в списочном контроле режим "Множественный выбор элементов", обратитесь к <a href="/doc/platform/developmentapl/service-development/service-contract/objects/blmethods/bllist/mass-select/">руководству разработчика</a>.
 */

/*
 * @name Controls/_list/interface/IList#multiSelectVisibility
 * @cfg {String} Whether multiple selection is enabled.
 * <a href="/materials/demo-ws4-list-multiselect">Example</a>.
 * @variant visible Show.
 * @variant hidden Do not show.
 * @variant onhover Show on hover.
 * @default hidden
 */

/**
 * @typedef {Object} ItemAction
 * @property {String} id Идентификатор операции.
 * @property {String} title Название операции.
 * @property {String} icon Иконка операции.
 * См. <a href="/docs/js/icons/">список иконок</a>.
 * @property {Number} [showType=0] Местоположение операции.
 * В свойство передается константа с соответствующим значением.
 * В значении "0" (по умолчанию) операция отображается в контекстном меню.
 * В значении "1" операция отображается в строке и в контекстном меню.
 * В значении "2" операция отображается в строке.
 * Когда в свойстве не передано значение, операция отображаются только в меню.
 * @property {String} style Стиль отображения операции над записью.
 * В свойству задают имя прикладного класса, которое в результате преобразуется в класс вида "controls-itemActionsV__action_style_имя_прикладного_класса".
 * Он будет установлен для html-контейнера самой операции над записью, а его свойства будут применены как к тексту (свойство title), так и к иконке (свойство icon).
 * См. <a href="/doc/platform/developmentapl/interface-development/controls/list/list/item-actions/#config-style">руководство разработчика</a>.
 * @property {String} [iconStyle=default] Стиль иконки.
 * Возможные значения: default, attention, error и done.
 * См. <a href="/doc/platform/developmentapl/interface-development/controls/list/list/item-actions/#config-style">руководство разработчика</a>.
 * @property {Function} handler Обработчик операции.
 * См. <a href="/doc/platform/developmentapl/interface-development/controls/list/list/item-actions/#item-actions-position">пример обработчика</a>.
 * @property {String} parent Ключ родителя операции.
 * @property {boolean|null} parent@ Поле, описывающее тип узла (список, узел, скрытый узел).
 * Подробнее о различиях между типами узлов можно прочитать <a href="/doc/platform/developmentapl/service-development/bd-development/vocabl/tabl/relations/#hierarchy">здесь</a>.
 */

/*
 * @typedef {Object} ItemAction
 * @property {String} id Identifier of operation.
 * @property {String} title Operation name.
 * @property {String} icon Operation icon.
 * @property {Number} showType Location of operation. (0 - menu | 1 - toolbar and menu | 2 - toolbar).
 * @property {String} style Operation style. (secondary | warning | danger | success).
 * @property {String} iconStyle Style of the action's icon. (secondary | warning | danger | success).
 * @property {Function} handler Operation handler.
 * @property {String} parent Key of the action's parent.
 * @property {boolean|null} parent@ Field that describes the type of the node (list, node, hidden node).
 */

/**
 * @name Controls/_list/interface/IList#itemActions
 * @cfg {Array.<ItemAction>} Конфигурация кнопок, которые будут отображаться при наведении указателя мыши на элемент.
 * <a href="/materials/demo-ws4-list-item-actions">См. демо-пример</a>.
 * Внимание: обязательно установите значение в опции <a href="/docs/js/Controls/grid/View/options/keyProperty/">keyProperty</a>, чтобы операции над записью работали корректно.
 */

/*
 * @name Controls/_list/interface/IList#itemActions
 * @cfg {Array.<ItemAction>} Array of configuration objects for buttons which will be shown when the user hovers over an item.
 * <a href="/materials/demo-ws4-list-item-actions">Example</a>.
 */

/**
 * @name Controls/_list/interface/IList#itemActionsPosition
 * @cfg {String} Позиция панели действий над записью в строке.
 * <a href="/materials/demo-ws4-list-item-actions">Example</a>.
 * @variant inside Панель действий над записью будет располагаться внутри строки.
 * @variant outside Панель действий над записью будет располагаться под строкой.
 * @variant custom Панель действий должна быть размещена в прикладном шаблоне itemTemplate.
 * <a href="/materials/demo-ws4-list-item-actions-custom">Example</a>.
 * @example
 * Размещаем опции записи в прикладном шаблоне с использованием itemActionsTemplate:
 *<pre>
 * <Controls.list:View
 *    itemActionsPosition="custom"
 *    itemActions="{{_itemActions}}">
 *    <ws:itemTemplate>
 *      <ws:partial template="Controls/list:ItemTemplate">
 *        <ws:contentTemplate>
 *          <ws:partial template="wml!customTemplateName"/>
 *        </ws:contentTemplate>
 *      </ws:partial>
 *    </ws:itemTemplate>
 * </Controls.list:View>
 *</pre>
 *
 * customTemplateName.wml:
 * <pre>
 *  <div>{{itemData.item.title}}</div>
 *    <ws:if data="{{!itemData.isSwiped}}">
 *      <ws:partial template="{{itemActionsTemplate}}"
 *                  attr:class="some-custom-class-for-itemActions"
 *                  itemData="{{itemData}}"
 *                  scope="{{_options}}"/>
 *    </ws:if>
 *  <div>{{itemData.item.description}}</div>
 * </pre>
 *
 */

/*
 * @name Controls/_list/interface/IList#itemActionsPosition
 * @cfg {String} Position of item actions.
 * <a href="/materials/demo-ws4-list-item-actions">Example</a>.
 * @variant inside Item actions will be positioned inside the item's row.
 * @variant outside Item actions will be positioned under the item's row.
 * @variant custom Item actions must be positioned in the itemTemplate.
 * <a href="/materials/demo-ws4-list-item-actions-custom">Example</a>.
 * @example
 * Placing Item Actions in custom item template using itemActionsTemplate
 *<pre>
 * <Controls.list:View
 *    itemActionsPosition="custom"
 *    itemActions="{{_itemActions}}">
 *    <ws:itemTemplate>
 *      <ws:partial template="Controls/list:ItemTemplate">
 *        <ws:contentTemplate>
 *          <ws:partial template="wml!customTemplateName"/>
 *        </ws:contentTemplate>
 *      </ws:partial>
 *    </ws:itemTemplate>
 * </Controls.list:View>
 *</pre>
 *
 * customTemplateName.wml:
 * <pre>
 *  <div>{{itemData.item.title}}</div>
 *    <ws:if data="{{!itemData.isSwiped}}">
 *      <ws:partial template="{{itemActionsTemplate}}"
 *                  attr:class="some-custom-class-for-itemActions"
 *                  itemData="{{itemData}}"
 *                  scope="{{_options}}"/>
 *    </ws:if>
 *  <div>{{itemData.item.description}}</div>
 * </pre>
 *
 */

/**
 * @event Controls/_list/interface/IList#itemMouseEnter Происходит в момент, когда курсор оказывается над элементом списка.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 * @param {Types/entity:Model} item Экземпляр записи, на которую был наведен курсор.
 * @param {Vdom/Vdom:SyntheticEvent} nativeEvent Дескриптор события мыши.
 */

/*
 * @event Controls/_list/interface/IList#itemMouseEnter Occurs when the cursor is over the list item.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Descriptor of the event.
 * @param {Types/entity:Model} item Instance of the item that the cursor was over.
 * @param {Vdom/Vdom:SyntheticEvent} nativeEvent Descriptor of the mouse event
 */

/**
 * @event Controls/_list/interface/IList#itemMouseLeave Происходит в момент, когда курсор уходит за пределы элемента списка.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 * @param {Types/entity:Model} item Экземпляр записи, за пределы которой ушел курсор.
 * @param {Vdom/Vdom:SyntheticEvent} nativeEvent Дескриптор события мыши.
 */

/*
 * @event Controls/_list/interface/IList#itemMouseLeave Occurs when the cursor leaves the list item.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Descriptor of the event.
 * @param {Types/entity:Model} item Instance of the item that the cursor was over.
 * @param {Vdom/Vdom:SyntheticEvent} nativeEvent Descriptor of the mouse event
 */

/**
 * @event Controls/_list/interface/IList#itemMouseMove Происходит в момент, когда курсор двигается по элементам списка.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 * @param {Types/entity:Model} item Экземпляр записи, по которой двигается курсор.
 * @param {Vdom/Vdom:SyntheticEvent} nativeEvent Дескриптор события мыши.
 */

/*
 * @event Controls/_list/interface/IList#itemMouseMove Occurs when the cursor moves over list items.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Descriptor of the event.
 * @param {Types/entity:Model} item Instance of the item that the cursor is moving along.
 * @param {Vdom/Vdom:SyntheticEvent} nativeEvent Descriptor of the mouse event
 */

/**
 * @event Controls/_list/interface/IList#actionClick Происходит при клике на элемент панели действий над записью.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 * @param {ItemAction} action Запись, по которой был выполнен клик.
 * @param {Types/entity:Model} item Экземпляр записи, по которой был выполнен клик.
 * @param {HTMLElement} itemContainer Контейнер записи, по которой был выполнен клик.
 */

/*
 * @event Controls/_list/interface/IList#actionClick Occurs when itemAction button is clicked.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Descriptor of the event.
 * @param {ItemAction} action Object with configuration of the clicked action.
 * @param {Types/entity:Model} item Instance of the item whose action was clicked.
 * @param {HTMLElement} itemContainer Container of the item whose action was clicked.
 */

/**
 * @name Controls/_list/interface/IList#actionAlignment
 * @cfg {String} Устанавливает выравнивание элементов в панели действий над записью в режиме swipe.
 * <a href="/materials/demo-ws4-swipe">Example</a>.
 * @variant horizontal Элементы будут выровнены по горизонтали.
 * @variant vertical Элементы будут выровнены по вертикали.
 */

/*
 * @name Controls/_list/interface/IList#actionAlignment
 * @cfg {String} Determines how item actions will be aligned on swipe.
 * <a href="/materials/demo-ws4-swipe">Example</a>.
 * @variant horizontal Actions will be displayed in a line.
 * @variant vertical Actions will be displayed in a line.
 */

/**
 * @name Controls/_list/interface/IList#actionCaptionPosition
 * @cfg {String} Позиция заголовка в панели действий над записью в режиме swipe.
 * <a href="/materials/demo-ws4-swipe">Example</a>.
 * @variant right Заголовок будет отображаться справа от иконки действия.
 * @variant bottom Заголовок будет отображаться под иконкой действия.
 * @variant none Заголовок не будет отображаться.
 */

/*
 * @name Controls/_list/interface/IList#actionCaptionPosition
 * @cfg {String} Determines where the caption of an item action will be displayed on swipe.
 * <a href="/materials/demo-ws4-swipe">Example</a>.
 * @variant right Title will be displayed to the right of the action's icon.
 * @variant bottom Title will be displayed under the action's icon.
 * @variant none Title will not be displayed.
 */

/**
 * @name Controls/_list/interface/IList#itemActionVisibilityCallback
 * @cfg {Function} Функция обратного вызова для определения видимости элементов в панели действий над записью.
 * @remark
 * Функция принимает два аргумента:
 * <ol>
 *    <li>action — объект с конфигурацией конкретной операции. Свойства объекта описаны <a href="/docs/js/Controls/list/IList/typedefs/ItemAction/">здесь</a>.</li>
 *    <li>item — модель (см. {@link Types/entity:Model}), содержащая данные записи. </li>
 * </ol>
 * Для видимости элемента, из функции следует вернуть true.
 * @example
 * Режим "Чтение" недоступен, если запись имеет свойство isNew === false.
 * WML:
 * <pre>
 * <Controls.list:View
 *     attr:class="demo-News"
 *     itemActions="{{_itemActions}}"
 *     source="{{_source}}"
 *     actionAlignment="vertical"
 *     actionCaptionPosition="bottom"
 *     markerVisibility="hidden"
 *     itemActionVisibilityCallback="{{_visibilityCallback}}"
 *     ...
 * </Controls.list:View>
 * </pre>
 * TS:
 * <pre>
 *  ...
 *  private _visibilityCallback(action: IItemAction, item: Model): boolean {
 *   if (action.title === 'Read') {
 *     return item.get('isNew');
 *   }
 *   return true;
 *  }
 *  ...
 * </pre>
 */

/*
 * @name Controls/_list/interface/IList#itemActionVisibilityCallback
 * @cfg {Function} item operation visibility filter function
 * @param {ItemAction} action Object with configuration of an action.
 * @param {Types/entity:Model} item Instance of the item whose action is being processed.
 * @returns {Boolean} Determines whether the action should be rendered.
 * @example
 * Item action Read don't display if item has property isNew === false
 * <pre>
 *    <Controls.list:View attr:class="demo-News"
 *                        itemActions="{{_itemActions}}"
 *                        source="{{_source}}"
 *                        actionAlignment="vertical"
 *                        actionCaptionPosition="bottom"
 *                        markerVisibility="hidden"
 *                        itemActionVisibilityCallback="{{_visibilityCallback}}"
 *                        ...
 *   </Controls.list:View>
 * </pre>
 * <pre>
 *  ...
 *  private _visibilityCallback(action: IItemAction, item: Model): boolean {
 *   if (action.title === 'Read') {
 *     return item.get('isNew');
 *   }
 *   return true;
 *  }
 *  ...
 * </pre>
 */

/**
 * @name Controls/_list/interface/IList#itemActionsProperty
 * @cfg {String} Имя свойства, содержащего конфигурацию панели действий над записью для текущей строки.
 */

/*
 * @name Controls/_list/interface/IList#itemActionsProperty
 * @cfg {String} Name of the item's property that contains item actions.
 */

/**
 * @name Controls/_list/interface/IList#markedKey
 * @cfg {Number} Идентификатор выделенной маркером строки.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 */

/*
 * @name Controls/_list/interface/IList#markedKey
 * @cfg {Number} Identifier of the marked collection item.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 */

/**
 * @name Controls/_list/interface/IList#markerVisibility
 * @cfg {String} Режим отображения маркера строки.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 * @variant visible Маркер отображается всегда, даже если ключевая запись не указана.
 * @variant hidden Маркер всегда скрыт.
 * @variant onactivated - Маркер отображается при активации списка. Например, когда пользователь отмечает запись.
 * @default onactivated
 */

/*
 * @name Controls/_list/interface/IList#markerVisibility
 * @cfg {String} Determines when marker is visible.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 * @variant visible The marker is always displayed, even if the marked key entry is not specified.
 * @variant hidden The marker is always hidden.
 * @variant onactivated - The marker is displayed on List activating. For example, when user mark a record.
 * @default onactivated
 */

/**
 * @name Controls/_list/interface/IList#uniqueKeys
 * @cfg {String} Определяет стратегию вставки элементов при загрузке с дублирующимися идентификаторами.
 * @remark
 * true - Merge, элементы с одинаковым идентификатором будут объединены в один.
 * false - Add, элементы с одинаковым идентификатором будут объединены в один.
 */

/*
 * @name Controls/_list/interface/IList#uniqueKeys
 * @cfg {String} Strategy for loading new list items.
 * @remark
 * true - Merge, items with the same identifier will be combined into one.
 * false - Add, items with the same identifier will be shown in the list.
 */

/**
 * @name Controls/_list/interface/IList#itemsReadyCallback
 * @cfg {Function} Функция обратного вызова, которая будет вызываться, когда экземпляр данных списка готов.
 * @remark
 * ARGUMENTS:
 * <ul>
 * <li>items {@link Types/collection:RecordSet RecordSet} с загруженными данными</li>
 * </ul>
 * На этом этапе можно сохранить ссылку на items, чтобы была возможноть потом менять их по ней
 * @example
 * <pre class="brush:js">
 * _myItemsReadyCallback = function(items) {
 *    this._myItems = items;
 * }
 * ...
 * deleteButtonClickHandler: function{
 *    this._myItems.removeAt(0);
 * }
 * </pre>
 */

/**
 * @name Controls/_list/interface/IList#dataLoadCallback
 * @cfg {Function} Функция обратного вызова, которая будет вызываться, когда данные загружены источником.
 * @remark
 * ARGUMENTS:
 * <ul>
 * <li>items {@link Types/collection:RecordSet RecordSet} с загруженными данными</li>
 * </ul>
 * dataLoadCallback может использоваться для изменения данных еще до того, как он будут отображены.
 * @example
 * <pre class="brush:js">
 * _myDataLoadCallback = function(items) {
 *    items.each(function(item){
 *       item.set(field, value);
 *    });
 * }
 * </pre>
 */

/**
 * @name Controls/_list/interface/IList#dataLoadErrback
 * @cfg {Function} Функция обратного вызова для определения сбоя загрузки данных из источника.
 */

/*
 * @name Controls/_list/interface/IList#dataLoadErrback
 * @cfg {Function} Callback function that will be called when data loading fail
 */

/**
 * @name Controls/_list/interface/IList#style
 * @cfg {String} Режим отображения списка.
 * @variant master Двухколоночный реестр.
 * @variant default Плоский список.
 * @default default
 */

/*
 * @name Controls/_list/interface/IList#style
 * @cfg {String} Control styling
 * @variant master Stylizes control as MasterDetail
 * @variant default Simple list
 * @default default
 */

/**
 * Перезагружает данные из источника данных.
 * @function Controls/_list/interface/IList#reload
 */

/*
 * Reloads list data and view.
 * @function Controls/_list/interface/IList#reload
 */

/**
 * @typedef {String} ReloadType
 * @variant query Элемент будет перезагружен с помощью метода "Поисковый запрос".
 * @variant read Элемент будет перезагружен с помощью метода "Прочитать".
 * @default read
 */

/*
 * @typedef {String} ReloadType
 * @variant query Item will be reloaded with query method
 * @variant read Item will be reloaded with read method
 * @default read
 */

/**
 * Загружает модель из источника данных, объединяет изменения в текущих данные и отображает элемент.
 * @function Controls/_list/interface/IList#reloadItem
 * @param {String} key Идентификатор элемента коллекции, который должен быть перезагружен из источника.
 * @param {Object} readMeta Метаинформация, которая будет передана методу запроса/чтения.
 * @param {Boolean} replaceItem Определяет, как загруженный элемент будет применяться к коллекции.
 * Если параметр имеет значение true, элемент коллекции будет заменен загруженным элементом.
 * Если параметр имеет значение false (по умолчанию), загруженные элементы будут объединены в элемент коллекции.
 * @param {ReloadType} reloadType Определяет, как будет загружен элемент.
 * @example
 *  <pre>
 *      _itemUpdated: function(id) {
 *          var list = this._children.myList;
 *          list.reloadItem(id);
 *      }
 * </pre>
 */

/**
 * Прокручивает список к указанному элементу.
 * @function Controls/_list/interface/IList#scrollToItem
 * @param {String|Number} key Идентификатор элемента коллекции, к которому осуществляется прокручивание.
 * @param {Boolean} toBottom Определяет, будет ли виден нижний край элемента. По умолчанию нижний край элемента виден.
 * @example
 *  <pre>
 *      _buttonClick: function() {
 *          var list = this._children.myList;
 *          list.scrollToItem(this._firstItemKey);
 *      }
 * </pre>
 */

/*
 * Loads model from data source, merges changes into the current data and renders the item.
 * @function Controls/_list/interface/IList#reloadItem
 * @param {String} key Identifier of the collection item, that should be reloaded from source.
 * @param {Object} readMeta Meta information, that which will be passed to the query/read method.
 * @param {Boolean} replaceItem Determine, how the loaded item will be applied to collection.
 * If the parameter is set to true, item from collection will replaced with loaded item.
 * if the parameter is set to false (by default), loaded item will merged to item from collection.
 * @param {reloadType} Determine how the item will be reloaded.
 * @example
 *  <pre>
 *      _itemUpdated: function(id) {
 *          var list = this._children.myList;
 *          list.reloadItem(id);
 *      }
 * </pre>
 */

/**
 * @event Controls/_list/interface/IList#itemClick Происходит при клике на элемент списка.
 * @param {Vdom/Vdom:SyntheticEvent} event Объект события.
 * @param {Types/entity:Record} item Элемент, по которому кликнули.
 * @param {Object} nativeEvent Объект нативного события браузера.
 */

 /*
 * @event Controls/_list/interface/IList#itemClick Occurs when list item is clicked.
 * @param {Vdom/Vdom:SyntheticEvent} event Event object.
 * @param {Types/entity:Record} item Clicked item.
 * @param {Object} nativeEvent Native event object.
 */

/**
 * @event Controls/_list/interface/IList#itemSwipe Происходит при жесте "swipe" на элементе списка.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 * @param {Types/entity:Model} item Экземпляр элемента списка, по которому производим swipe.
 * @param {Object} nativeEvent Объект нативного события браузера.
 * @remark
 * Событие срабатывает, только если со списком ничего не происходит при жесте "swipe" (например, если список поддерживает выбор, он будет только устанавливать флаг). Это поведение схоже с {@link Controls/_list/interface/IList#itemClick itemClick}.
 */

/*
 * @event Controls/_list/interface/IList#itemSwipe Occurs when list item is swiped.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Descriptor of the event.
 * @param {Types/entity:Model} item Instance of the swiped item.
 * @param {Object} nativeEvent Descriptor of the original event. It is useful if you want to get direction or target.
 * @remark
 * This event fires only if the list doesn't do anything on swipe (e.g., if the list supports selection - it will toggle checkbox and that's it). This behavior is in line with the {@link Controls/_list/interface/IList#itemClick itemClick}.
 */

/**
 * @event Controls/_list/interface/IList#hoveredItemChanged Происходит при наведении курсора мыши на элемент списка.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 * @param {Types/entity:Model} item Экземпляр элемента, на который наводим курсор.
 * @param {HTMLElement} itemContainer Контейнер элемента.
 */

/**
 * @event Controls/_list/interface/IList#activeElementChanged Происходит при смене активного элемента в процессе скроллирования
 * @param {Vdom/Vdom:SyntheticEvent<Event>} event Дескриптор события
 * @param {string} key Ключ активного элемента
 * @remark Активным элементом считается последний элемент, который находится выше середины вьюпорта.
 * Для высчитывания активного элемента в списочном контроле должен быть включен виртуальный скроллинг.
 * @see shouldCheckActiveElement
 */

/*
 * @event Controls/_list/interface/IList#hoveredItemChanged The event fires when the user hovers over a list item with a cursor.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Descriptor of the event.
 * @param {Types/entity:Model} item Instance of the item whose action was clicked.
 * @param {HTMLElement} itemContainer Container of the item.
 */

/**
 * @event  Controls/_list/interface/IList#markedKeyChanged Происходит при выделении пользователем элемента списка.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 * @param {Number} key Ключ выбранного элемента.
 */

/*
 * @event  Controls/_list/interface/IList#markedKeyChanged Occurs when list item was selected (marked).
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject The event descriptor.
 * @param {Number} key Key of the selected item.
 */

/**
 * @event  Controls/_list/interface/IList#drawItems Происходит при отрисовке очередного набора данных.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
 */

/*
 * @event  Controls/_list/interface/IList#drawItems Occurs when the next batch of data is drawn.
 * <a href="/materials/demo-ws4-list-base">Example</a>.
 * @param {Vdom/Vdom:SyntheticEvent} eventObject The event descriptor.
 */

/**
 * @typedef {Object} VerticalItemPaddingEnum
 * @variant null Без отступа.
 * @variant S Маленький отступ.
 * @default S
 */

/*
 * @typedef {Object} VerticalItemPaddingEnum
 * @variant null Without padding.
 * @variant S Small padding.
 * @default S
 */

/**
 * @typedef {Object} HorizontalItemPaddingEnum
 * @variant null Без отступа.
 * @variant XS Минимальный отступ.
 * @variant S Маленький отступ.
 * @variant M Средний отступ.
 * @variant L Большой отступ.
 * @variant XL Очень большой оступ.
 * @variant XXL Максимальный отступ.
 * @default M
 */

/*
 * @typedef {Object} HorizontalItemPaddingEnum
 * @variant null without padding.
 * @variant XS Extra small padding.
 * @variant S Small padding.
 * @variant M Medium padding.
 * @variant L Large padding.
 * @variant XL Extra large padding.
 * @variant XXL Extra extra large padding.
 * @default M
 */

/**
 * @typedef {Object} ItemPadding
 * @property {VerticalItemPaddingEnum} [top] Отступ от содержимого элемента до верхней границы элемента.
 * @property {VerticalItemPaddingEnum} [bottom] Отступ от содержимого элемента до нижней границы элемента.
 * @property {HorizontalItemPaddingEnum} [left] Отступ от содержимого элемента до левой границы элемента.
 * @property {HorizontalItemPaddingEnum} [right] Отступ от содержимого элемента до правой границы элемента.
 */

/*
 * @typedef {Object} ItemPadding
 * @property {VerticalItemPaddingEnum} [top] Padding from item content to top item border.
 * @property {VerticalItemPaddingEnum} [bottom] Padding from item content to bottom item border.
 * @property {HorizontalItemPaddingEnum} [left] Padding from item content to left item border.
 * @property {HorizontalItemPaddingEnum} [right] Padding from item content to right item border.
 */

/**
 * @cfg {ItemPadding} Конфигурация внутренних отступов строки.
 * @name Controls/_list/interface/IList#itemPadding
 */

/*
 * @cfg {ItemPadding} Configuration inner paddings in the item.
 * @name Controls/_list/interface/IList#itemPadding
 */

