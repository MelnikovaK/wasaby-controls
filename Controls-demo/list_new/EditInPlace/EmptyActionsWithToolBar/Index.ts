import {Control, TemplateFunction} from "UI/Base"
import * as Template from "wml!Controls-demo/list_new/EditInPlace/EmptyActionsWithToolBar/EmptyActionsWithToolBar"
import {Memory} from "Types/source"
import {getFewCategories as getData} from "../../DemoHelpers/DataCatalog"
import 'css!Controls-demo/Controls-demo'

export default class extends Control {
    protected _template: TemplateFunction = Template;
    private _viewSource: Memory;
    private _newData = getData().slice(0, 1);

    protected _beforeMount() {
        this._newData[0].id = null;
        this._viewSource = new Memory({
            keyProperty: 'id',
            data: this._newData
        })
    }
}
