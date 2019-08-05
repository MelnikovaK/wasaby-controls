define('Controls/interface/ISelectedCollection', [
], function() {
   /**
    * Интерфейс для выбора элементов из списка.
    * @interface Controls/interface/ISelectedCollection
    * @public
    * @author Капустин И.А.
    */
   /*
    * Interface to select items from the list.
    * @interface Controls/interface/ISelectedCollection
    * @public
    * @author Kapustin I.A.
    */

   /**
    * @name Controls/interface/ISelectedCollection#displayProperty
    * @cfg {String} Имя свойства элемента, содержимое которого будет отображаться.
    * @example
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *          source="{{_source}}"
    *          displayProperty="title">
    *    </Controls.lookup:Selector>
    * </pre>
    */
   /*
    * @name Controls/interface/ISelectedCollection#displayProperty
    * @cfg {String} Name of the item property which content will be displayed.
    * @example
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *          source="{{_source}}"
    *          displayProperty="title">
    *    </Controls.lookup:Selector>
    * </pre>
    */
   
   /**
    * @name Controls/interface/ISelectedCollection#multiSelect
    * @cfg {Boolean} Включает режим множественного выбора значений.
    * @default false
    * @variant true Можно выбрать сколько угодно много значений.
    * @variant false После выбора первого значения, поле ввода пропадает. При выборе нового значения из справочника, оно перетирает старое.
    *
    * @example
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *          source="{{_source}}"
    *          multiSelect="{{true}}">
    *    </Controls.lookup:Selector>
    * </pre>
    */
   /*
    * @name Controls/interface/ISelectedCollection#multiSelect
    * @cfg {Boolean} Enables multiple value selection mode.
    * @default false
    * @variant true You can select as many values ​​as you want.
    * @variant false After selecting the first value, the input field disappears. When you select a new value from the directory, it grinds the old.
    *
    * @example
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *          source="{{_source}}"
    *          multiSelect="{{true}}">
    *    </Controls.lookup:Selector>
    * </pre>
    */

   /**
    * @name Controls/interface/ISelectedCollection#maxVisibleItems
    * @cfg {Integer} Максимальное количество элементов для отображения, остальные будут скрыты под счетчиком.
    * @default 7
    * @remark
    * Актуально только в многострочном режиме
    * @see Controls/interface/ISelectedCollection#multiSelect
    *
    * @example
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *          source="{{_source}}"
    *          multiSelect="{{true}}"
    *          maxVisibleItems="{{3}}">
    *    </Controls.lookup:Selector>
    * </pre>
    */
   /*
    * @name Controls/interface/ISelectedCollection#maxVisibleItems
    * @cfg {Integer} The maximum number of items to display, the rest will be hidden under the counter.
    * @default 7
    * @remark
    * Only relevant in multi line mode.
    * @see Controls/interface/ISelectedCollection#multiSelect
    *
    * @example
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *          source="{{_source}}"
    *          multiSelect="{{true}}"
    *          maxVisibleItems="{{3}}">
    *    </Controls.lookup:Selector>
    * </pre>
    */

   /**
    * @name Controls/interface/ISelectedCollection#itemTemplate
    * @cfg {Function|String} Шаблон выбранного элемента.
    * @remark
    * Базовый шаблон для Controls/lookup:Input: "Controls.lookup:ItemTemplate".
    * Базовый шаблон для Controls.lookup:Selector: "Controls.lookup:ButtonItemTemplate".
    * Базовый шаблон поддерживают такие параметры как:
    * <ul>
    *    <li>contentTemplate {Function|String} - Шаблон содержимого элемента.</li>
    *    <li>crossTemplate {Function|String} - Шаблон крестика удаления элемента.</li>
    *    <li>displayProperty {String} - Имя поля, значение которого будет отображаться.</li>
    *    <li>clickable {Boolean} - Определяет, показывать ли подчеркивание при наведении, допустим только в случае использования contentTemplate по умолчанию.</li>
    *    <li>size {Enum} - Размер текста для содержимого элемента, допустим только в случае использования contentTemplate по умолчанию.</li>
    *    <ul>
    *       <li>m</li>
    *       <li>l</li>
    *       <li>xl</li>
    *       <li>2xl</li>
    *       <li>3xl</li>
    *    </ul>
    *    <li>style {Enum} - Стиль текста для содержимого элемента, допустим только в случае использования contentTemplate по умолчанию.</li>
    *    <ul>
    *       <li>default</li>
    *       <li>bold</li>
    *       <li>accent</li>
    *       <li>primary</li>
    *    </ul>
    * </ul>
    *
    * Если вы переопределите contentTemplate/crossTemplate, вы не будете уведомлены о событиях itemClick/crossClick.
    * Для правильной работы необходимо пометить свой контент классами:
    * <ul>
    *    <li>js-controls-SelectedCollection__item__caption</li>
    *    <li>js-controls-SelectedCollection__item__cross</li>
    * </ul>
    *
    * @example
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *          source="{{_source}}"
    *          keyProperty="id">
    *       <ws:itemTemplate>
    *          <ws:partial template="Controls.lookup:ButtonItemTemplate"
    *                      style="primary"
    *                      size="xl"
    *                      displayProperty="title"
    *                      clickable="{{true}}"/>
    *       </ws:itemTemplate>
    *    </Controls.lookup:Selector>
    * </pre>
    */
   /*
    * @name Controls/interface/ISelectedCollection#itemTemplate
    * @cfg {Function|String} Selected item template.
    * @remark
    * Base itemTemplate for Controls/lookup:Input: "Controls.lookup:ItemTemplate".
    * Base itemTemplate for Controls.lookup:Selector: "Controls.lookup:ButtonItemTemplate".
    * Base itemTemplate supports these parameters:
    * <ul>
    *    <li>contentTemplate {Function|String} - Template for render item content.</li>
    *    <li>crossTemplate {Function|String} - Template for render cross.</li>
    *    <li>displayProperty {String} - Name of the item property which content will be displayed.</li>
    *    <li>clickable {Boolean} - Specifies whether elements are clickable, adds an underscore when the element is hover, is only valid if the default value is used for the contentTemplate.</li>
    *    <li>size {Enum} - The text size for the item content, is only valid if the default value is used for the contentTemplate.</li>
    *    <ul>
    *       <li>m</li>
    *       <li>l</li>
    *       <li>xl</li>
    *       <li>2xl</li>
    *       <li>3xl</li>
    *    </ul>
    *    <li>style {Enum} - The text style for the item content, is only valid if the default value is used for the contentTemplate.</li>
    *    <ul>
    *       <li>default</li>
    *       <li>bold</li>
    *       <li>accent</li>
    *       <li>primary</li>
    *    </ul>
    * </ul>
    *
    * If you reimplement contentTemplate/crossTemplate, you will not be notified of itemClick/crossClick events.
    * To work properly, you need to mark your content with classes:
    * <ul>
    *    <li>js-controls-SelectedCollection__item__caption</li>
    *    <li>js-controls-SelectedCollection__item__cross</li>
    * </ul>
    *
    * @example
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *          source="{{_source}}"
    *          keyProperty="id">
    *       <ws:itemTemplate>
    *          <ws:partial template="Controls.lookup:ButtonItemTemplate"
    *                      style="primary"
    *                      size="xl"
    *                      displayProperty="title"
    *                      clickable="{{true}}"/>
    *       </ws:itemTemplate>
    *    </Controls.lookup:Selector>
    * </pre>
    */

   /**
    * @event Controls/interface/ISelectedCollection#textValueChanged Происходит при изменении набора выбранной коллекции.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject Декскриптор события.
    * @param {String} textValue Строка, сформированная из выбранных записей.
    *
    * @example
    * В следующем примере создается Controls/lookup:Selector и демонстрируется сценарий использования.
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *       source="{{_source}}"
    *       keyProperty="id"
    *       on:textValueChanged="onTextValueChanged()">
    *    </Controls.lookup:Selector>
    * </pre>
    * JS:
    * <pre>
    *    onTextValueChanged: function(e, textValue) {
    *       UserConfig.setParam('selectedItems', textValue);
    *    }
    * </pre>
    */
   /*
    * @event Controls/interface/ISelectedCollection#textValueChanged Occurs when changing the set of the selected collection.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject The event descriptor.
    * @param {String} textValue String formed from selected entries.
    *
    * @example
    * The following example creates Controls/lookup:Selector and shows how to handle the event.
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *       source="{{_source}}"
    *       keyProperty="id"
    *       on:textValueChanged="onTextValueChanged()">
    *    </Controls.lookup:Selector>
    * </pre>
    * JS:
    * <pre>
    *    onTextValueChanged: function(e, textValue) {
    *       UserConfig.setParam('selectedItems', textValue);
    *    }
    * </pre>
    */

   /**
    * @event Controls/interface/ISelectedCollection#itemsChanged Происходит при изменении набора выбранной коллекции.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
    * @param {RecordSet|List} items Список выбранных записей.
    *
    * @example
    * В следующем примере создается Controls/lookup:Selector и демонстрируется сценарий использования.
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *       source="{{_source}}"
    *       keyProperty="id"
    *       on:itemsChanged="onItemsChanged()">
    *    </Controls.lookup:Selector>
    * </pre>
    * JS:
    * <pre>
    *    onItemsChanged: function(e, items) {
    *       this.prepareItems(items);
    *    }
    * </pre>
    */
   /*
    * @event Controls/interface/ISelectedCollection#itemsChanged Occurs when changing the set of the selected collection.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject The event descriptor.
    * @param {RecordSet|List} items List of selected entries.
    *
    * @example
    * The following example creates Controls/lookup:Selector and shows how to handle the event.
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *       source="{{_source}}"
    *       keyProperty="id"
    *       on:itemsChanged="onItemsChanged()">
    *    </Controls.lookup:Selector>
    * </pre>
    * JS:
    * <pre>
    *    onItemsChanged: function(e, items) {
    *       this.prepareItems(items);
    *    }
    * </pre>
    */

   /**
    * @event Controls/interface/ISelectedCollection#itemClick Происходит при нажатии на элемент коллекции.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
    * @param {RecordSet} item Элемент выбраной коллекции.
    *
    * @example
    * В следующем примере создается Controls/lookup:Selector и демонстрируется сценарий использования.
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *       source="{{_source}}"
    *       keyProperty="id"
    *       on:itemClick="onItemClick()">
    *    </Controls.lookup:Selector>
    * </pre>
    * JS:
    * <pre>
    *    openCard: function() {
    *       ...
    *    },
    *
    *    onItemClick: function(e, item) {
    *       this.openCard(item);
    *    }
    * </pre>
    */
   /*
    * @event Controls/interface/ISelectedCollection#itemClick Occurs when clicking on a collection item.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject The event descriptor.
    * @param {RecordSet} item Item selected collection.
    *
    * @example
    * The following example creates Controls/lookup:Selector and shows how to handle the event.
    * WML:
    * <pre>
    *    <Controls.lookup:Selector
    *       source="{{_source}}"
    *       keyProperty="id"
    *       on:itemClick="onItemClick()">
    *    </Controls.lookup:Selector>
    * </pre>
    * JS:
    * <pre>
    *    openCard: function() {
    *       ...
    *    },
    *
    *    onItemClick: function(e, item) {
    *       this.openCard(item);
    *    }
    * </pre>
    */

   /**
    * @event Controls/interface/ISelectedCollection#openInfoBox Происходит перед открытием всплывающего окна со всеми выбранными записями.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
    * @param {Object} config Конфиг, по которому будет построено всплывающее окно.
    *
    * @example
    * В следующем примере создается Controls/lookup:Input и демонстрируется сценарий использования.
    * WML:
    * <pre>
    *    <Controls.lookup:Input
    *       source="{{_source}}"
    *       keyProperty="id"
    *       searchParam="title"
    *       on:openInfoBox="_openInfoBox()">
    *    </Controls.lookup:Input>
    * </pre>
    * JS:
    * <pre>
    *    _openInfoBox: function(e, config) {
    *       config.maxWidth = 500;
    *       config.templateOptions.items = new collection.List({
    *          items: Chain(config.templateOptions.items).sort(function() {
    *             ...
    *          }).value()
    *       })
    *    }
    * </pre>
    *
    * @see Controls/interface/ISelectedCollection#closeInfoBox
    */
   /*
    * @event Controls/interface/ISelectedCollection#openInfoBox Occurs before opening a pop-up with all selected entries
    * @param {Vdom/Vdom:SyntheticEvent} eventObject The event descriptor.
    * @param {Object} config Config on which popup will be built.
    *
    * @example
    * The following example creates Controls/lookup:Input and shows how to handle the event.
    * WML:
    * <pre>
    *    <Controls.lookup:Input
    *       source="{{_source}}"
    *       keyProperty="id"
    *       searchParam="title"
    *       on:openInfoBox="_openInfoBox()">
    *    </Controls.lookup:Input>
    * </pre>
    * JS:
    * <pre>
    *    _openInfoBox: function(e, config) {
    *       config.maxWidth = 500;
    *       config.templateOptions.items = new collection.List({
    *          items: Chain(config.templateOptions.items).sort(function() {
    *             ...
    *          }).value()
    *       })
    *    }
    * </pre>
    *
    * @see Controls/interface/ISelectedCollection#closeInfoBox
    */

   /**
    * @event Controls/interface/ISelectedCollection#closeInfoBox Происходит при закрытии всплывающего окна со всеми выбранными записями.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
    *
    * @example
    * В следующем примере создается Controls/lookup:Input и демонстрируется сценарий использования.
    * WML:
    * <pre>
    *    <Controls.lookup:Input
    *       source="{{_source}}"
    *       keyProperty="id"
    *       searchParam="title"
    *       on:closeInfoBox="_closeInfoBox()">
    *    </Controls.lookup:Input>
    * </pre>
    * JS:
    * <pre>
    *    _closeInfoBox: function() {
    *       this._isOpenInfoBox = false;
    *    }
    * </pre>
    *
    * @see Controls/interface/ISelectedCollection#openInfoBox
    */
   /*
    * @event Controls/interface/ISelectedCollection#closeInfoBox Occurs when closing a pop-up with all selected entries.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject The event descriptor.
    *
    * @example
    * The following example creates Controls/lookup:Input and shows how to handle the event.
    * WML:
    * <pre>
    *    <Controls.lookup:Input
    *       source="{{_source}}"
    *       keyProperty="id"
    *       searchParam="title"
    *       on:closeInfoBox="_closeInfoBox()">
    *    </Controls.lookup:Input>
    * </pre>
    * JS:
    * <pre>
    *    _closeInfoBox: function() {
    *       this._isOpenInfoBox = false;
    *    }
    * </pre>
    *
    * @see Controls/interface/ISelectedCollection#openInfoBox
    */
});
