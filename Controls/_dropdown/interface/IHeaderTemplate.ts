

   /**
    * Интерфейс для выпадающих списков, поддерживающих шаблон шапки списка.
    *
    * @interface Controls/_dropdown/interface/IHeaderTemplate
    * @public
    * @author Золотова Э.Е.
    */

   /*
    * Interface for dropdown lists that support the template for the header.
    *
    * @interface Controls/_dropdown/interface/IHeaderTemplate
    * @public
    * @author Золотова Э.Е.
    */

   /**
    * @name Controls/_dropdown/interface/IHeaderTemplate#headerTemplate
    * @cfg {Function | String} Шаблон отображения для шапки меню.
    * @default "Controls/dropdownPopup:Template"
    * @remark
    * По умолчанию для отрисовки шапки меню используется базовый шаблон Controls/dropdownPopup:Template.
    * Изменяя параметры базового шаблона вы можете задать собственное отображение шапки меню.
    * Параметры шаблона:
    * * caption — текст заголовка. Когда значение параметра не задано, оно наследуется из опции {@link Controls/_interface/ICaption#caption caption}.
    * * icon — иконка. Когда значение параметра не задано, оно наследуется из опции {@link Controls/_interface/IIcon#icon icon}.
    * * headContentTemplate — пользовательский контент шапки. Контентная опция. В области видимости доступны параметры caption и icon.
    * @example
    * Меню с текстом заголовка — "Add".
    * * WML
    * <pre>
    *    <Controls.dropdown:Button
    *          keyProperty="id"
    *          icon="icon-medium icon-AddButtonNew"
    *          source="{{_source)}}"
    *          tooltip="Add">
    *       <ws:headerTemplate>
    *           <Controls.Container.Async templateName="Controls/dropdownPopup:Template">
    *             <ws:partial template="{{ content.resolvedTemplate }}" scope="{{ headTemplate }}" caption="Add"/>
    *          </Controls.Container.Async>
    *       </ws:headerTemplate>
    *    </Controls.dropdown:Button>
    * </pre>
    * * JavaScript
    * <pre>
    * _source: null,
    * _beforeMount: function() {
    *    this._source = new source.Memory ({
    *       data: [
    *          { id: 1, title: 'Task in development' },
    *          { id: 2, title: 'Error in development' }
    *       ],
    *       keyProperty: 'id'
    *    });
    * }
    * </pre>
    */

   /*
    * @name Controls/_dropdown/interface/IHeaderTemplate#headerTemplate
    * @cfg {Function | String} Template that will be rendered above the list.
    * @default "Controls/dropdownPopup:Template"
    * @remark
    * To determine the template, you should call the base template 'Controls/dropdownPopup:Template'.
    * The template should be placed in the component using the <ws:partial> tag with the template attribute.
    * By default, the base template 'Controls/dropdownPopup:Template' will display caption and icon, if they are set. You can change the following options:
    * <ul>
    *     <li>caption - header text,</li>
    *     <li>icon - header icon.</li>
    * </ul>
    * @example
    * Menu with text header - "Add".
    * TMPL:
    * <pre>
    *    <Controls.Button.Menu
    *          keyProperty="id"
    *          icon="icon-medium icon-AddButtonNew"
    *          source="{{_source)}}"
    *          tooltip="Add">
    *       <ws:headerTemplate>
    *           <Controls.Container.Async templateName="Controls/dropdownPopup:Template">
    *             <ws:partial template="{{ content.resolvedTemplate }}" scope="{{ headTemplate }}" caption="Add"/>
    *          </Controls.Container.Async>
    *       </ws:headerTemplate>
    *    </Controls.Button.Menu>
    * </pre>
    * JS:
    * <pre>
    *    this._source = new Memory ({
    *       data: [
    *           { id: 1, title: 'Task in development' },
    *           { id: 2, title: 'Error in development' }
    *       ],
    *       keyProperty: 'id'
    *    });
    * </pre>
    */

