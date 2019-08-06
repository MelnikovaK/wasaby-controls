define('Controls/interface/IGrouped', [
], function() {

   /**
    * Интерфейс для контролов, реализующих группировку элементов.
    *
    * @interface Controls/interface/IGrouped
    * @public
    * @author Авраменко А.С.
    */

   /**
    * @name Controls/interface/IGrouped#groupingKeyCallback
    * @cfg {Function} Функция обратного вызова для получения идентификатора группы элемента списка.
    * <a href="/materials/demo-ws4-list-group">Example</a>.
    * @remark
    * Среди групп списка существует "скрытая группа".
    * Для такой группы не создаётся заголовок, а её элементы визуально размещены в начале списка.
    * Чтобы отнести элемент к скрытой группе, из функции groupingKeyCallback верните константу view.hiddenGroup, которая принадлежит библиотеке Controls/Constants.
    * @example
    * <pre>
    *    _groupByBrand: function(item) {
    *       if (item.get('brand') === 'apple') {
    *          return ControlsConstants.view.hiddenGroup;
    *       }
    *       return item.get('brand');
    *    }
    * </pre>
    * <pre>
    *    groupingKeyCallback ="{{_groupByBrand}}",
    * </pre>
    */

   /**
    * @name Controls/interface/IGrouped#groupTemplate
    * @cfg {Function} Шаблон группировки.
    * <a href="/materials/demo-ws4-list-group">Example</a>.
    * @remark
    * Базовый шаблон группировки "Controls/grid:GroupTemplate".
    * Шаблон группировки поддерживает параметры:
    * <ul>
    *    <li>separatorVisibility (тип Boolean) — видимость горизонтальной линии-разделителя.</li>
    *    <li>expanderVisibility (тип Boolean) — видимость кнопки-экспандера, позволяющей сворачивать/разворачивать группу.</li>
    *    <li>textAlign (тип String) — горизонтальное выравнивание текста группы. Доступные значения: 'left' и 'right'. По умолчанию используется выравнивание текста по центру.</li>
    *    <li>rightTemplate (тип Function) — шаблон, выводимый в правой части группы. Может использоваться, например, для вывода итогов по группе.</li>
    * </ul>
    * @example
    * Пример использования пользовательских параметров для группового рендеринга в Controls.list:View без экспандера и с выравниванием текста слева:
    * <pre>
    *    <Controls.list:View
    *       <ws:groupTemplate>
    *          <ws:partial template="Controls/list:GroupTemplate" expanderVisibility="{{ false }}" textAlign="left" />
    *       </ws:groupTemplate>
    *    </Controls.list:View>
    * </pre>
    */

   /**
    * @name Controls/interface/IGrouped#collapsedGroups
    * @cfg {Array} Список идентификаторов свернутых групп. Идентификаторы групп получаются в результате вызова {@link groupingKeyCallback}.
    * <a href="/materials/demo-ws4-list-group">Example</a>.
    */

   /**
    * @name Controls/interface/IGrouped#groupHistoryId
    * @cfg {String} Идентификатор для сохранения в истории списка идентификаторов свернутых групп.
    */

   /**
    * @event Controls/interface/IGrouped#groupExpanded Происходит при развертывании группы.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
    * <a href="/materials/demo-ws4-list-group">Example</a>.
    */

   /**
    * @event Controls/interface/IGrouped#groupCollapsed Происходит при сворачивании группы.
    * @param {Vdom/Vdom:SyntheticEvent} eventObject Дескриптор события.
    * <a href="/materials/demo-ws4-list-group">Example</a>.
    */

});

