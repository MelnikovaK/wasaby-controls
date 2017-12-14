define('js!Controls/List/interface/IListControl', [
], function() {

   /**
    * Интерфейс работы списков.
    *
    * @mixin Controls/List/interface/IListControl
    * @public
    */

   /**
    * @name Controls/List/interface/IListControl#contextMenuEnabled
    * @cfg {Boolean} Показывать ли контекстное меню при клике на правую кнопку мыши
    */

   /**
    * @name Controls/List/interface/IListControl#emptyTemplate
    * @cfg {Function} Шаблон отображения пустого списка
    */

   /**
    * @name Controls/List/interface/IListControl#footerTemplate
    * @cfg {Function} Устанавливает шаблон, который будет отображаться под элементами коллекции.
    */

   /**
    * @typedef {String} ResultsPosition
    * @variant top отобразить перед списком
    * @variant bottom отобразить после списка
    */

   /**
    * @typedef {Object} Results
    * @property {Function} template шаблон отображения
    * @property {ResultsPosition} position позиция в списке
    */

   /**
    * @name Controls/List/interface/IListControl#results
    * @cfg {Results} Настройки отображения строки итогов
    */

   /**
    * @name Controls/List/interface/IListControl#virtualScrollConfig
    * @cfg {Object} Конфигурация виртуального скролла
    */

   /**
    * @name Controls/List/interface/IListControl#sorting
    * @cfg {Object} Конфигурация сортировки (ключи объекта - названия полей; значения - тип сортировки: 'ASC' - по возрастанию или 'DESC' - по убыванию)
    */

   /**
    * @name Controls/List/interface/IListControl#multiSelectVisibility
    * @cfg {Boolean} Разрешен ли множественный выбор.
    * @variant visible Показывать всегда
    * @variant hidden Никогда не показывать
    * @variant onhover Показывать только по ховеру
    * @variant null По умолчанию
    */

   /**
    * @name Controls/List/interface/IListControl#itemActions
    * @cfg {Array} Операции над записью
    */

   /**
    * @name Controls/List/interface/IListControl#uniqueKeys
    * @cfg {String} Стратегия действий с подгружаемыми в список записями
    * @variant true Мержить, при этом записи с одинаковыми id схлопнутся в одну
    * @variant false Добавлять, при этом записи с одинаковыми id будут выводиться в списке
    */

   /**
    * @function Controls/List/interface/IListControl#reload
    * Перезагружает набор записей представления данных с последующим обновлением отображения
    */

   /**
    * @function Controls/List/interface/IListControl#reloadItem
    * Перезагружает модель из источника данных, мержит изменения к текущим данным и перерисовывает запись
    */

   /**
    * @function Controls/List/interface/IListControl#scrollToTop
    * Скролит табличное представление в самый вверх
    */

   /**
    * @function Controls/List/interface/IListControl#scrollToBottom
    * Скролит табличное представление в самый низ
    */

   /**
    * @function Controls/List/interface/IListControl#scrollToItem
    * Скролит табличное представление к указанному элементу
    */

   /**
    * @event Controls/List/interface/IListControl#itemClicked Происходит при клике по строке
    */

   /**
    * @event Controls/List/interface/IListControl#dataLoaded Происходит при загрузке данных
    */
});