import {Control, IControlOptions, TemplateFunction} from 'UI/Base';
import controlTemplate = require('wml!Controls-demo/Spoiler/Heading/Heading');
import 'css!Controls-demo/Controls-demo';

class Heading extends Control<IControlOptions> {
    private _expanded1: boolean = true;
    private _expanded2: boolean = true;
    private _expanded3: boolean = true;
    private _expanded4: boolean = true;
    private _expanded5: boolean = true;
    private _expanded6: boolean = true;
    protected _template: TemplateFunction = controlTemplate;
    static _theme: string[] = ['Controls/Classes'];
}
export default Heading;
