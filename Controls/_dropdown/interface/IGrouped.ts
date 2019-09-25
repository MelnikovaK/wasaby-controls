/**
 * Интерфейс для контрола "Выпадающий список" с возможностью группировки элементов.
 *
 * @interface Controls/_dropdown/interface/IGrouped
 * @public
 * @author Золотова Э.Е.
 */

/*
 * Interface for controls with  implementing item grouping.
 *
 * @interface Controls/_dropdown/interface/IGrouped
 * @public
 * @author Золотова Э.Е.
 */

/**
 * @name Controls/_dropdown/interface/IGrouped#groupingKeyCallback
 * @cfg {Function} Функция обратного вызова для получения идентификатора группы элемента списка.
 * @example
 * TMPL:
 * <pre>
 *    <Controls.dropdown:Menu
 *          keyProperty="id"
 *          icon="icon-small icon-AddButtonNew"
 *          source="{{_source}}"
 *          groupingKeyCallback="{{_groupingKeyCallback}}"/>
 * </pre>
 * JS:
 * <pre>
 *    this._groupingKeyCallback = function(item) {
 *        return item.get('group');
 *    }
 *    this._source = new Memory({
 *        data: [
 *                   { id: 1, title: 'Task in development', group: 'Select' },
 *                   { id: 2, title: 'Error in development', group: 'Select' },
 *                   { id: 3, title: 'Application', group: 'Select' },
 *                   { id: 4, title: 'Assignment', group: 'Create' },
 *                   { id: 5, title: 'Approval', group: 'Create' },
 *                   { id: 6, title: 'Working out', group: 'Create' },
 *                   { id: 7, title: 'Assignment for accounting', group: 'Create' },
 *                   { id: 8, title: 'Assignment for delivery', group: 'Create' },
 *                   { id: 9, title: 'Assignment for logisticians', group: 'Create' }
 *            ],
 *        keyProperty: 'id'
 *     });
 * </pre>
 */

/*
 * @name Controls/_dropdown/interface/IGrouped#groupingKeyCallback
 * @cfg {Function} Function that returns group identifier.
 * @example
 * TMPL:
 * <pre>
 *    <Controls.dropdown:Menu
 *          keyProperty="id"
 *          icon="icon-small icon-AddButtonNew"
 *          source="{{_source}}"
 *          groupingKeyCallback="{{_groupingKeyCallback}}"/>
 * </pre>
 * JS:
 * <pre>
 *    this._groupingKeyCallback = function(item) {
 *        return item.get('group');
 *    }
 *    this._source = new Memory({
 *        data: [
 *                   { id: 1, title: 'Task in development', group: 'Select' },
 *                   { id: 2, title: 'Error in development', group: 'Select' },
 *                   { id: 3, title: 'Application', group: 'Select' },
 *                   { id: 4, title: 'Assignment', group: 'Create' },
 *                   { id: 5, title: 'Approval', group: 'Create' },
 *                   { id: 6, title: 'Working out', group: 'Create' },
 *                   { id: 7, title: 'Assignment for accounting', group: 'Create' },
 *                   { id: 8, title: 'Assignment for delivery', group: 'Create' },
 *                   { id: 9, title: 'Assignment for logisticians', group: 'Create' }
 *            ],
 *        keyProperty: 'id'
 *     });
 * </pre>
 */

/**
 * @name Controls/_dropdown/interface/IGrouped#groupTemplate
 * @cfg {Function | String} Шаблон группировки.
 * @remark
 * Для определения шаблона вызовите базовый шаблон - "Controls/dropdownPopup:GroupTemplate".
 * Шаблон должен быть помещен в компонент с помощью тега <ws:partial> с атрибутом "template".
 * Базовый шаблон wml!Controls/_dropdownPopup/defaultGroupTemplate по умолчанию отображает только разделитель.
 * Вы можете изменить отображение разделителя, установив опцию:
 *    -  showText - определяет, отображается ли название группы.
 * Содержимое можно переопределить с помощью параметра "contentTemplate".
 * Параметр "groupingKeyCallback" тоже должен быть установлен.
 * @example
 * TMPL:
 * <pre>
 *    <Controls.dropdown:Menu
 *          keyProperty="id"
 *          icon="icon-small icon-AddButtonNew"
 *          groupingKeyCallback="{{_groupingKeyCallback}}"
 *          source="{{_source}}">
 *       <ws:groupTemplate>
 *          <ws:partial template="Controls/dropdownPopup:GroupTemplate" showText="{{true}}" />
 *       </ws:groupTemplate>
 *    </Controls.dropdown:Menu>
 * </pre>
 * JS:
 * <pre>
 *    this._groupingKeyCallback = function(item) {
 *        return item.get('group');
 *    }
 *    this._source = new Memory({
 *        data: [
 *                   { id: 1, title: 'Task in development', group: 'Select' },
 *                   { id: 2, title: 'Error in development', group: 'Select' },
 *                   { id: 3, title: 'Application', group: 'Select' },
 *                   { id: 4, title: 'Assignment', group: 'Create' },
 *                   { id: 5, title: 'Approval', group: 'Create' },
 *                   { id: 6, title: 'Working out', group: 'Create' },
 *                   { id: 7, title: 'Assignment for accounting', group: 'Create' },
 *                   { id: 8, title: 'Assignment for delivery', group: 'Create' },
 *                   { id: 9, title: 'Assignment for logisticians', group: 'Create' }
 *            ],
 *        keyProperty: 'id'
 *    });
 * </pre>
 */

/*
 * @name Controls/_dropdown/interface/IGrouped#groupTemplate
 * @cfg {Function | String} Group template.
 * @remark
 * To determine the template, you should call the base template "Controls/dropdownPopup:GroupTemplate".
 * The template should be placed in the component using the <ws:partial> tag with the template attribute.
 * By default, the base template wml!Controls/_dropdownPopup/defaultGroupTemplate only displays a separator.  You can change the separator display by setting the option:
 *    -  showText - sets the display of the group name.
 * You can redefine content using the contentTemplate option.
 * The groupingKeyCallback option must also be set.
 * @example
 * TMPL:
 * <pre>
 *    <Controls.dropdown:Menu
 *          keyProperty="id"
 *          icon="icon-small icon-AddButtonNew"
 *          groupingKeyCallback="{{_groupingKeyCallback}}"
 *          source="{{_source}}">
 *       <ws:groupTemplate>
 *          <ws:partial template="Controls/dropdownPopup:GroupTemplate" showText="{{true}}" />
 *       </ws:groupTemplate>
 *    </Controls.dropdown:Menu>
 * </pre>
 * JS:
 * <pre>
 *    this._groupingKeyCallback = function(item) {
 *        return item.get('group');
 *    }
 *    this._source = new Memory({
 *        data: [
 *                   { id: 1, title: 'Task in development', group: 'Select' },
 *                   { id: 2, title: 'Error in development', group: 'Select' },
 *                   { id: 3, title: 'Application', group: 'Select' },
 *                   { id: 4, title: 'Assignment', group: 'Create' },
 *                   { id: 5, title: 'Approval', group: 'Create' },
 *                   { id: 6, title: 'Working out', group: 'Create' },
 *                   { id: 7, title: 'Assignment for accounting', group: 'Create' },
 *                   { id: 8, title: 'Assignment for delivery', group: 'Create' },
 *                   { id: 9, title: 'Assignment for logisticians', group: 'Create' }
 *            ],
 *        keyProperty: 'id'
 *    });
 * </pre>
 */
