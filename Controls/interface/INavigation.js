define('Controls/interface/INavigation', [
], function() {

   /**
    * Интерфейс для поддержки навигации по спискам.
    *
    * @interface Controls/interface/INavigation
    * @public
    * @author Крайнов Д.О.
    */

   /*
    * Interface for list navigation.
    *
    * @interface Controls/interface/INavigation
    * @public
    * @author Крайнов Д.О.
    */

   /**
    * @typedef {String} NavigationSource
    * @variant position Навигация по курсору.
    * @variant page Постраничная навигация.
    */

   /*
    * @typedef {String} NavigationSource
    * @variant position Position-based navigation (cursor).
    * @variant page Page-based navigation.
    */

   /**
    * @typedef {String} NavigationView
    * @variant infinity Бесконечный скролл.
    * @variant pages Страницы с постраничной навигацией.
    * @variant demand Подгружать данные при нажатии на кнопку "Еще".
    */

   /*
    * @typedef {String} NavigationView
    * @variant infinity Infinite scroll.
    * @variant pages Pages with paging control.
    * @variant demand Load next when requested (for example, hasMore button clicked).
    */

   /**
    * @typedef {Object} PositionSourceConfig Конфигурация для навигации по курсору.
    * @property {String|Array} field Поле (массив полей), используемый для навигации по курсору.
    * @property {String|Array} position Значение поля (массива полей), используемого для навигации по курсору.
    * @property {String} direction Направление загрузки.
    * Поддерживаются следующие значения:
    * <ul>
    *    <li><b>after</b> -  Загружать данные после позиционируемой записи.
    *    <li><b>before</b> -  Загружать данные до позиционируемой записи.
    *    <li><b>both</b> -  Загружать данные в обоих направлениях относительно позиционируемой записи.
    * </ul>
    * @property {Number} limit Ограничение количества записей, запрошенных для одной загрузки.
    */

   /*
    * @typedef {Object} PositionSourceConfig Source configuration for position-based (cursor) navigation.
    * @property {String|Array} field Field (fields array) used for position-based navigation.
    * @property {String|Array} position Value of field (fields array) used for position-based navigation.
    * @property {String} direction Loading direction.
    * The following values are supported:
    * <ul>
    *    <li><b>after</b> -  loading data after positional record.
    *    <li><b>before</b> -  loading data before positional record.
    *    <li><b>both</b> -  loading data in both directions relative to the positional record.
    * </ul>
    * @property {Number} limit Limit of records requested for a single load.
    */

   /**
    * @typedef {Object} PageSourceConfig Конфигурация для постраничной навигации.
    * @property {Number} page Загружать номер страницы.
    * @property {Number} pageSize Загружать размер страницы.
    * @property {Boolean} hasMore Если поле hasMore имеет значение false, аналогичный параметр добавляется в запрос. В ответ, вместо получения флага наличия записей (логическое значение), ожидается общее количество записей (числовое значение).
    */
   
   /*
    * @typedef {Object} PageSourceConfig Source configuration for page-based navigation.
    * @property {Number} page Loading page number.
    * @property {Number} pageSize Loading page size.
    * @property {Boolean} hasMore If hasMore field has false value, similar parameter is added to request. In response instead of receiving a flag for the presence of records (boolean value), the total count of records is expected (number value).
    */

   /**
    * @typedef {Object} NavigationViewConfig
    * @property {String} pagingMode Режим отображения постраничной навигации. 
    * Поддерживаются следующие значения:
    * <ul>
    *    <li><b>direct</b> - Постраничная навигация отображается в прямом направлении: от первой страницы до последней.</li>
    * </ul>
    */

   /*
    * @typedef {Object} NavigationViewConfig
    * @property {String} pagingMode Paging display mode.
    * The following values are supported:
    * <ul>
    *    <li><b>direct</b> - paging is displayed in the forward direction: from the first page to the last.</li>
    * </ul>
    */

   /**
    * @typedef {Object} Navigation
    * @property {NavigationSource} source Алгоритм, с которым работает источник данных.
    * @property {NavigationView} view Режим визуального отображения навигации (кнопка навигации и т.д.).
    * @property {PositionSourceConfig|PageSourceConfig} sourceConfig Конфигурация источника данных.
    * @property {NavigationViewConfig} viewConfig Конфигурация визуального отображения навигации.
    */

   /*
    * @typedef {Object} Navigation
    * @property {NavigationSource} source Algorithm with which the data source works.
    * @property {NavigationView} view Visual interface for navigation (paging buttons, etc.).
    * @property {PositionSourceConfig|PageSourceConfig} sourceConfig Configuration for data source.
    * @property {NavigationViewConfig} viewConfig Configuration for navigation view.
    */

   /**
    * @name Controls/interface/INavigation#navigation
    * @cfg {Navigation} Конфигурация навигации по списку. Настройка навигации источника данных (страниц, смещения, положения) и визуального отображения навигации (страниц, бесконечного скролла и т.д.).
    * @example
    * В этом примере в списке будут отображаться 2 элемента.
    * TMPL:
    * <pre>
    *    <Controls.list:View
    *       keyProperty="id"
    *       source="{{_source}}"
    *       navigation="{{_navigation}}"/>
    * </pre>
    * JS:
    * <pre>
    *    this._source = new Memory({
    *      idProperty: 'id',
    *      data: [
    *         {
    *            id: '1',
    *            title: 'Yaroslavl'
    *         },
    *         {
    *            id: '2',
    *            title: 'Moscow'
    *         },
    *         {
    *            id: '3',
    *            title: 'St-Petersburg'
    *         }
    *      ]
    *    });
    *    this._navigation = {
    *       source: 'page',
    *       view: 'pages',
    *       sourceConfig: {
    *          pageSize: 2,
    *          page: 0
    *       }
    *    };
    * </pre>
    */

   /*
    * @name Controls/interface/INavigation#navigation
    * @cfg {Navigation} List navigation configuration. Configures data source navigation (pages, offset, position) and navigation view (pages, infinite scroll, etc.)
    * @example
    * In this example, 2 items will be displayed in the list.
    * TMPL:
    * <pre>
    *    <Controls.list:View
    *       keyProperty="id"
    *       source="{{_source}}"
    *       navigation="{{_navigation}}"/>
    * </pre>
    * JS:
    * <pre>
    *    this._source = new Memory({
    *      idProperty: 'id',
    *      data: [
    *         {
    *            id: '1',
    *            title: 'Yaroslavl'
    *         },
    *         {
    *            id: '2',
    *            title: 'Moscow'
    *         },
    *         {
    *            id: '3',
    *            title: 'St-Petersburg'
    *         }
    *      ]
    *    });
    *    this._navigation = {
    *       source: 'page',
    *       view: 'pages',
    *       sourceConfig: {
    *          pageSize: 2,
    *          page: 0
    *       }
    *    };
    * </pre>
    */

});
