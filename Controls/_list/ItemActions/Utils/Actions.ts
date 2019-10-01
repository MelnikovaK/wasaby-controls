export function itemActionsClick(self, event, action, itemData, listModel, showAll): void {
    event.stopPropagation();
    if (action._isMenu) {
        self._notify('menuActionsClick', [itemData, event, showAll]);
    } else if (action['parent@']) {
        self._notify('menuActionClick', [itemData, event, action]);
    } else {
        //TODO: self._container может быть не HTMLElement, а jQuery-элементом, убрать после https://online.sbis.ru/opendoc.html?guid=d7b89438-00b0-404f-b3d9-cc7e02e61bb3
        const container = self._container.get ? self._container.get(0) : self._container;
        const isNewModel = !!listModel.getSourceIndexByItem;

        let contents;
        if (isNewModel) {
            // TODO breadcrumbs for new model
            contents = itemData.getContents();
        } else {
            contents = itemData.item;
            if (itemData.breadCrumbs) {
                contents = contents[contents.length - 1];
            }
        }

        const itemIndex = isNewModel ? listModel.getSourceIndexByItem(itemData) : itemData.index;
        let targetContainer;

        /*
        * https://online.sbis.ru/opendoc.html?guid=5d2c482e-2b2f-417b-98d2-8364c454e635
        * под опцией, чтобы не отломать никому ничего.
        * опцию спилит Егор при переходе на table-layout и отказе от partialGrid
        * https://online.sbis.ru/doc/5d2c482e-2b2f-417b-98d2-8364c454e635
        * */
        if (self._options.fix1177894367) {
            targetContainer = event.target.closest('.controls-Grid__row-cell');
        } else {
            targetContainer = Array.prototype.filter.call(container.querySelector('.controls-ListView__itemV').parentNode.children, function (item) {
                return item.className.indexOf('controls-ListView__itemV') !== -1;
            })[itemIndex - listModel.getStartIndex()];
        }

        const args = [
            action,
            contents,
            targetContainer
        ];
        self._notify('actionClick', args);
        if (action.handler) {
            action.handler(args[1]);
        }
    }
}
